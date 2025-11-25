import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import React from "react";
import { fuzzyFilter } from "./fuzzyFIlter";


export default function Table<T>({ data, columns }: { data: any[], columns: any[] }) {

    const [sortedState, setSortedState] = React.useState<any>([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0, //initial page index
        pageSize: 10, //default page size
    });
    const table = useReactTable<T>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting: sortedState,
            pagination: pagination,
        },
        onSortingChange: setSortedState,
        onPaginationChange: setPagination,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        globalFilterFn: fuzzyFilter,
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="overflow-x-auto p-4">
            <input
                value={table.getState().globalFilter ?? ""}
                onChange={e => table.setGlobalFilter(e.target.value)}
                placeholder="Search all columns..."
                className="input input-bordered  mb-4"
            />
            <table className="table">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => {
                        return (
                            <tr>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <th style={{ width: header.getSize() }}
                                            colSpan={header.colSpan}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}

                                            <button className="badge badge-accent badge-sm ml-3" onClick={header.column.getToggleSortingHandler()} >
                                                :
                                            </button>
                                        </th>
                                    )
                                })}
                            </tr>
                        )
                    })
                    }
                </thead>

                <tbody>
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <tr>
                                {row.getVisibleCells().map((cell) => {
                                    return (
                                        <td>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>

                <tfoot>
                    {table.getFooterGroups().map((footerGroup) => (
                        <tr>
                            {footerGroup.headers.map((footer) => (
                                <th>
                                    {footer.isPlaceholder ? null : flexRender(footer.column.columnDef.footer, footer.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </tfoot>


            </table>
            <div className="flex items-center gap-2 mt-4">
                <button
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="btn btn-error btn-sm"
                >
                    {'<<'}
                </button>
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="btn btn-error btn-sm"
                >
                    {'<'}
                </button>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                    className="btn btn-error btn-sm"
                >
                    {[1, 5, 10, 15, 20, 25, 30, 100].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            {pageSize}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="btn btn-error btn-sm"
                >
                    {'>'}
                </button>
                <button
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    className="btn btn-error btn-sm"
                >
                    {'>>'}
                </button>

            </div>
        </div>
    )
}
