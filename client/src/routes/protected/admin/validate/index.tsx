
import { createFileRoute } from '@tanstack/react-router';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF worker (using CDN for simplicity in this env, or local if build setup allows)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;


export const Route = createFileRoute('/protected/admin/validate/')({
    component: ValidationPage,
});

type TicketDetails = {
    id: number;
    movie: string;
    genre: string;
    screen: string;
    showTime: string;
    showDate: string;
    seats: string[];
    isUsed: boolean;
};

function ValidationPage() {
    const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'pdf'>('scan');
    const [inputTicketId, setInputTicketId] = useState('');
    const [scannedId, setScannedId] = useState<string | null>(null);

    // State for fetched ticket details
    const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // PDF State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isReadingPdf, setIsReadingPdf] = useState(false);


    // 1. Fetch Ticket Details Details Only
    const fetchTicket = async (id: string) => {
        setFetchError(null);
        setTicketDetails(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/tickets/${id}/qr`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Ticket not found');

            setTicketDetails(json.data.data);
            setScannedId(id);
        } catch (err: any) {
            setFetchError(err.message);
        }
    };


    // 2. Validate Mutation (Mark as Used)
    const { mutate: validateTicket, isPending: isValidating, isSuccess: isValidated } = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${import.meta.env.VITE_API_LINK}/api/tickets/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Validation failed');
            return data;
        },
        onSuccess: () => {
            // Refresh details (specifically isUsed status)
            if (scannedId) fetchTicket(scannedId);
        }
    });


    // --- Handlers ---

    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const rawValue = detectedCodes[0].rawValue;
            let idToFetch = rawValue;
            try {
                const parsed = JSON.parse(rawValue);
                if (parsed.id) idToFetch = String(parsed.id);
            } catch (e) {
                // Raw ID
            }

            if (idToFetch !== scannedId) {
                fetchTicket(idToFetch);
            }
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputTicketId) fetchTicket(inputTicketId);
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsReadingPdf(true);
        setFetchError(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const page = await pdf.getPage(1);
            await page.getTextContent();

            setFetchError("Could not extract Ticket ID from PDF automatically. Note: Feature pending specific PDF format.");

        } catch (err: any) {
            console.error(err);
            setFetchError("Failed to read PDF file.");
        } finally {
            setIsReadingPdf(false);
        }
    };


    return (
        <main className="min-h-screen py-8 px-8">
            <div className="cineverse-container">
                <h1 className="text-2xl font-bold mb-6">Ticket Validation</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* LEFT: Input Methods */}
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title justify-center mb-4">Input Ticket</h2>

                            <div role="tablist" className="tabs tabs-lifted mb-4">
                                <a role="tab" className={`tab ${activeTab === 'scan' ? 'tab-active' : ''}`} onClick={() => setActiveTab('scan')}>Scan QR</a>
                                <a role="tab" className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`} onClick={() => setActiveTab('manual')}>Ticket ID</a>
                                <a role="tab" className={`tab ${activeTab === 'pdf' ? 'tab-active' : ''}`} onClick={() => setActiveTab('pdf')}>Upload PDF</a>
                            </div>

                            <div className="min-h-[300px] flex flex-col justify-center">
                                {activeTab === 'scan' && (
                                    <div className="rounded-lg overflow-hidden relative bg-black aspect-square max-w-xs mx-auto w-full border-4 border-base-300">
                                        <Scanner onScan={handleScan} />
                                        <p className="text-white text-center absolute bottom-2 w-full text-xs bg-black/50 p-1">Point at QR code</p>
                                    </div>
                                )}

                                {activeTab === 'manual' && (
                                    <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                                        <label className="fieldset-label font-medium">Enter Ticket Number</label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full input-lg"
                                            placeholder="e.g. 105"
                                            value={inputTicketId}
                                            onChange={(e) => setInputTicketId(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary btn-lg">Find Ticket</button>
                                    </form>
                                )}

                                {activeTab === 'pdf' && (
                                    <div className="flex flex-col gap-4 items-center p-6 border-2 border-dashed border-base-300 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="file-input file-input-bordered w-full max-w-xs"
                                            onChange={handlePdfUpload}
                                            ref={fileInputRef}
                                        />
                                        {isReadingPdf && <span className="loading loading-spinner loading-md"></span>}
                                        <p className="text-xs text-gray-500 text-center">
                                            Upload ticket PDF. <br />(Experimental text extraction)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {fetchError && (
                                <div role="alert" className="alert alert-error mt-4 text-sm shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{fetchError}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Ticket Details & Action */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 h-full">
                        <div className="card-body">
                            <h2 className="card-title justify-center border-b pb-4 mb-4 text-xl">Ticket Details</h2>

                            {!ticketDetails ? (
                                <div className="flex flex-col items-center justify-center flex-grow opacity-50 min-h-[300px] text-center p-8 border-2 border-dashed border-base-300 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 text-base-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                                    <p className="text-lg font-medium">No ticket selected</p>
                                    <p className="text-sm">Scan a QR code or enter an ID to view details.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">

                                    {/* Status Badge */}
                                    <div className={`
                                  flex flex-col items-center p-4 rounded-xl border-2
                                  ${ticketDetails.isUsed
                                            ? 'bg-warning/10 border-warning text-warning-content'
                                            : 'bg-success/10 border-success text-success-content'}
                              `}>
                                        {ticketDetails.isUsed ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-1 text-warning" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                <span className="text-xl font-bold uppercase tracking-wider text-warning">Already Used</span>
                                                <span className="text-xs opacity-70">This ticket has been redeemed.</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-1 text-success" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                <span className="text-xl font-bold uppercase tracking-wider text-success">Valid Ticket</span>
                                                <span className="text-xs opacity-70">Ready for validation.</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Info List */}
                                    <div className="bg-base-200/50 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between items-center border-b border-base-300 pb-2">
                                            <span className="opacity-60 text-sm">Ticket ID</span>
                                            <span className="font-mono font-bold text-lg">#{ticketDetails.id}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="opacity-60 text-sm">Movie</span>
                                            <span className="font-bold text-lg text-primary">{ticketDetails.movie}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="opacity-60 text-sm">Show Config</span>
                                            <span className="font-medium">{ticketDetails.screen}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="opacity-60 text-sm">Date & Time</span>
                                            <span className="font-medium">{ticketDetails.showDate} • {ticketDetails.showTime}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-base-300">
                                            <span className="opacity-60 text-sm">Seats</span>
                                            <span className="font-mono font-bold text-xl">{ticketDetails.seats.join(', ')}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-2">
                                        {ticketDetails.isUsed ? (
                                            <button className="btn btn-disabled btn-lg w-full bg-base-300 text-base-content/50 border-base-300" disabled>
                                                Cannot Re-Validate
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-primary btn-lg w-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                                                onClick={() => validateTicket(String(ticketDetails.id))}
                                                disabled={isValidating || isValidated}
                                            >
                                                {isValidating ? (
                                                    <>
                                                        <span className="loading loading-spinner"></span> Validating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                        VALIDATE TICKET
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {isValidated && (
                                        <div role="alert" className="alert alert-success shadow-sm animate-in zoom-in duration-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>Ticket marked as used successfully!</span>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
