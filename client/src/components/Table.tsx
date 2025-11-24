import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import React from "react";
import { fuzzyFilter } from "./fuzzyFIlter";


export default function Table<T>({ data, columns }: { data: any[], columns: any[] }) {

    const [sortedState, setSortedState] = React.useState<any>([]);
    const table = useReactTable<T>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state:{
            sorting: sortedState
        },
        onSortingChange: setSortedState,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        globalFilterFn: fuzzyFilter
    });
    return (
        <div className="overflow-x-auto">
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
                                        <th style={{width: header.getSize()}}
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
        </div>
    )
}
