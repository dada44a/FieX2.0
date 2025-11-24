import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";


export default function Table<T>({ data, columns }: { data: any[], columns: any[] }) {
    const table = useReactTable<T>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });
    return (
        <div className="overflow-x-auto">
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
