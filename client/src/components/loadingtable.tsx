import React from "react"

export const LoadingTable = React.memo((props:{wantToShow:boolean}) => {
  return (
     <>
     {props.wantToShow && (
        <div className="skeleton h-[130px] w-[330px] rounded-xl m-10"></div>
      )}
        <div className="overflow-x-auto p-10">
          <table className="table w-full">
            <thead>
              <tr>
                <th><div className="skeleton h-4 w-10"></div></th>
                <th><div className="skeleton h-4 w-10"></div></th>
                <th><div className="skeleton h-4 w-10"></div></th>
                <th><div className="skeleton h-4 w-10"></div></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton h-4 w-10"></div></td>
                  <td><div className="skeleton h-4 w-10"></div></td>
                  <td><div className="skeleton h-4 w-10"></div></td>
                  <td><div className="skeleton h-4 w-10"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
  )
});