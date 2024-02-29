import { type RequiredField } from '@/utils/Types';
import { Table, TableProps, theme } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { VariableSizeGrid } from 'react-window';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';

export default function VirtualisedTable<RecordType extends object>(
  props: RequiredField<TableProps<RecordType>, 'scroll' | 'columns'> & { ref?: React.Ref<any> },
) {
  const { columns, scroll, ref } = props!;
  const [tableWidth, setTableWidth] = useState(0);
  const { token } = theme.useToken();

  const widthColumnCount = columns.filter(({ width }) => !width).length;
  const mergedColumns = columns.map((column) => {
    if (column.width) {
      return column;
    }

    return {
      ...column,
      width: Math.floor(tableWidth / widthColumnCount),
    };
  });

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, 'scrollLeft', {
      get: () => {
        if (gridRef.current) {
          return gridRef.current?.state?.scrollLeft;
        }
        return null;
      },
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });

    return obj;
  });

  const resetVirtualGrid = () => {
    gridRef.current?.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: true,
    });
  };

  useEffect(() => resetVirtualGrid, [tableWidth]);

  const renderVirtualList = (rawData: readonly object[], { scrollbarSize, ref, onScroll }: any) => {
    ref.current = connectObject;
    const totalHeight = rawData.length * 54;

    return (
      <VariableSizeGrid
        ref={gridRef}
        className="virtual-grid"
        columnCount={mergedColumns.length}
        columnWidth={(index: number) => {
          const { width } = mergedColumns[index];
          return totalHeight > Number(scroll.y) && index === mergedColumns.length - 1
            ? Number(width) - scrollbarSize - 1
            : Number(width);
        }}
        height={Number(scroll.y)}
        rowCount={rawData.length}
        rowHeight={() => 54}
        width={tableWidth}
        onScroll={({ scrollLeft }: { scrollLeft: number }) => {
          onScroll({ scrollLeft });
        }}
      >
        {({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => (
          <div
            className={classNames('virtual-table-cell', {
              'virtual-table-cell-last': columnIndex === mergedColumns.length - 1,
            })}
            style={{
              ...style,
              boxSizing: 'border-box',
              padding: token.padding,
              borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
              background: token.colorBgContainer,
            }}
          >
            {(rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex]}
          </div>
        )}
      </VariableSizeGrid>
    );
  };

  return (
    <ResizeObserver
      onResize={({ width }) => {
        setTableWidth(width);
      }}
    >
      <Table
        {...props}
        className="virtual-table"
        columns={mergedColumns}
        pagination={false}
        components={{
          body: renderVirtualList,
        }}
        ref={ref}
      />
    </ResizeObserver>
  );
}
