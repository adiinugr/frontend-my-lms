'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import { FormHelperText, IconButton } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { rankItem, type RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { TextFieldProps } from '@mui/material/TextField'

import { toast } from 'react-toastify'

import type { SubjectGroupListType } from '@/types/subjectGroupTypes'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import AddSubjectListDrawer from './AddSubjectListDrawer'
import CustomTextField from '@core/components/mui/TextField'
import EditSubjectListDrawer from '@/views/subject-group/edit/EditSubjectListDrawer'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { createSubjectsToSubjectGroup, deleteSubjectsToSubjectGroupById } from '@/libs/actions/subjectsToSubjectGroups'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type SubjectGroupListTypeWithAction = SubjectGroupListType & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Column Definitions
const columnHelper = createColumnHelper<SubjectGroupListTypeWithAction>()

const SubjectGroupEditListTable = ({
  mappedSubjectsData,
  subjectData,
  selectedSubjectGroup
}: {
  mappedSubjectsData: any
  subjectData: any
  selectedSubjectGroup: any
}) => {
  const { push } = useRouter()

  // States
  const [addSubjectOpen, setAddSubjectOpen] = useState(false)
  const [editSubjectOpen, setEditSubjectOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})

  const [data, setData] = useState(...[mappedSubjectsData])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [selectedEditSubject, setSelecteEditSubject] = useState<{ subjectOrder: number; name: string }>({
    subjectOrder: 0,
    name: ''
  })

  const [globalFilter, setGlobalFilter] = useState('')

  const handleClickEdit = (original: SubjectGroupListTypeWithAction) => {
    setSelecteEditSubject(original)
    setEditSubjectOpen(true)
  }

  useEffect(() => {
    if (data.length === 0) {
      setError('Mata pelajaran tidak boleh kosong!')
    } else {
      setError('')
    }
  }, [data?.length, error])

  const handleSubmit = async () => {
    const mappedSubjectData = data.map((subject: { name: string; subjectOrder: number }) => {
      const filteredData: { id: number }[] = subjectData.filter((value: { name: string }) => value.name == subject.name)

      return {
        subjectOrder: subject.subjectOrder,
        id: filteredData[0].id
      }
    })

    setIsLoading(true)

    try {
      await deleteSubjectsToSubjectGroupById(selectedSubjectGroup.id)

      const subjectToSubjectGroupPromise = await Promise.all(
        mappedSubjectData.map(async (val: { subjectOrder: number; id: number }) => {
          const res = await createSubjectsToSubjectGroup({
            subjectOrder: val.subjectOrder,
            subjectId: val.id,
            subjectGroupId: selectedSubjectGroup.id
          })

          return res
        })
      )

      const isResError = subjectToSubjectGroupPromise.some(el => el.statusCode !== 201)

      if (isResError) {
        toast.error(`Gagal mengubah Data Mapel! Silakan hubungi Admin!`)
        setIsLoading(false)

        return
      }

      toast.success(`Berhasil mengubah Data Mapel!`)
      setIsLoading(false)

      push('/teacher/setting/subject-group/list')
    } catch (error) {
      setIsLoading(false)

      toast.error(`Gagal mengubah Data Mapel! Silakan hubungi Admin!`)
    }
  }

  const columns = useMemo<ColumnDef<SubjectGroupListTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('subjectOrder', {
        header: 'No Urut',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.subjectOrder}
          </Typography>
        )
      }),
      columnHelper.accessor('name', {
        header: 'Nama Mapel',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.name}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={() =>
                setData(
                  data?.filter(
                    (product: { subjectOrder: number }) => product.subjectOrder !== row.original.subjectOrder
                  )
                )
              }
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleClickEdit(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )

  const table = useReactTable({
    data: data as SubjectGroupListType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      sorting: [
        {
          id: 'subjectOrder',
          desc: false
        }
      ],
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Card>
        <CardHeader title='Data Mata Pelajaran' className='pbe-4' />
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Cari Mapel'
              className='max-sm:is-full'
            />
            <Button
              variant='tonal'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setAddSubjectOpen(!addSubjectOpen)}
              className='max-sm:is-full'
            >
              Tambah Mapel
            </Button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <div className='p-6'>{error && <FormHelperText error>{error}</FormHelperText>}</div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />

        <div className='p-6 grid place-content-end'>
          <Button
            disabled={isLoading}
            type='submit'
            onClick={handleSubmit}
            fullWidth
            variant='contained'
            className='capitalize w-fit'
            startIcon={<i className='tabler-device-floppy' />}
          >
            {isLoading ? 'Loading...' : 'Simpan Data Mapel'}
          </Button>
        </div>
      </Card>
      <AddSubjectListDrawer
        open={addSubjectOpen}
        handleClose={() => setAddSubjectOpen(!addSubjectOpen)}
        selectedSubjects={data}
        setData={setData}
      />
      <EditSubjectListDrawer
        open={editSubjectOpen}
        handleClose={() => setEditSubjectOpen(!editSubjectOpen)}
        selectedSubjects={data}
        setData={setData}
        selectedEditSubject={selectedEditSubject}
      />
    </>
  )
}

export default SubjectGroupEditListTable
