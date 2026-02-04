import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <table
        ref={ref}
        className={`w-full border-collapse ${className}`}
        {...props}
      >
        {children}
      </table>
    );
  }
);

Table.displayName = 'Table';

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <thead ref={ref} className={className} {...props}>
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = 'TableHeader';

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={className} {...props}>
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = 'TableBody';

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  highlight?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ highlight = false, className = '', children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={`
          transition-colors duration-150
          hover:bg-overlay/30
          ${highlight ? 'bg-red/10' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ sortable = false, sorted = false, className = '', children, ...props }, ref) => {
    const isCenter = className.includes('text-center');
    const isRight = className.includes('text-right');

    return (
      <th
        ref={ref}
        className={`
          bg-overlay/50
          text-muted text-[11px] font-semibold uppercase tracking-wider
          px-4 py-3
          border-b border-border
          first:rounded-tl-xl last:rounded-tr-xl
          ${sortable ? 'cursor-pointer hover:bg-overlay transition-colors' : ''}
          ${className}
        `}
        {...props}
      >
        <span className={`
          flex items-center gap-1 w-full
          ${isCenter ? 'justify-center' : isRight ? 'justify-end' : ''}
        `}>
          {children}
          {sortable && (
            <span className={sorted ? 'text-accent' : 'text-muted/50'}>
              {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
            </span>
          )}
        </span>
      </th>
    );
  }
);

TableHead.displayName = 'TableHead';

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={`
          px-4 py-3
          text-sm
          border-b border-border
          last:[&:is(tr:last-child_td)]:border-b-0
          ${className}
        `}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export type { TableProps, TableHeaderProps, TableBodyProps, TableRowProps, TableHeadProps, TableCellProps };
