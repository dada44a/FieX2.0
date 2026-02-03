import "dotenv/config";

async function testKhalti() {
    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!secretKey) {
        console.error("❌ KHALTI_SECRET_KEY is missing from .env");
        return;
    }

    console.log("Found Key:", secretKey.substring(0, 5) + "...");

    try {
        const payload = {
            return_url: "http://localhost:3000/success",
            website_url: "http://localhost:3000",
            amount: 1000, // 10 Rs
            purchase_order_id: "test-" + Date.now(),
            purchase_order_name: "Test Order",
            customer_info: {
                name: "Test User",
                email: "test@example.com",
                phone: "9800000000",
            },
        };

        const res = await fetch("https://dev.khalti.com/api/v2/epayment/initiate/", {
            method: "POST",
            headers: {
                Authorization: `Key ${secretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

testKhalti();
