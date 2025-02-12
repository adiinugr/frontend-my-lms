'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import { IconButton, Tooltip } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { toast } from 'react-toastify'
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

import type { AchievementType, AddAchievementType } from '@/types/achievementTypes'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import AddAchievementDrawer from './AddAchievementDrawer'
import CustomTextField from '@core/components/mui/TextField'
import DeleteDialog from '@/components/other/DeleteDialog'
import UpdateAchievementDrawer from './UpdateAchievementDrawer'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Actions
import {
  createAchievements,
  deleteAchievementById,
  getAchievementById,
  updateAchievement
} from '@/libs/actions/achievements'
import type { StudentType } from '@/types/usersTypes'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type AchievementTypeWithAction = {
  id: number
  title: string
  category: string
  medal: string
  level: string
  organizer: string
  date: string
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
const columnHelper = createColumnHelper<AchievementTypeWithAction>()

const AchievementListTable = ({
  tableData,
  studentId
}: {
  tableData?: StudentType['achievements']
  studentId: number
}) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Crud State
  const [addAchievementOpen, setAddAchievementOpen] = useState(false)
  const [updateAchievementOpen, setUpdateAchievementOpen] = useState(false)

  const [selectedDataById, setSelectedDataById] = useState<{
    id: number | null
    title: string
    category: string
    medal: string
    level: string
    organizer: string
    date: string
  }>({
    id: null,
    title: '',
    category: '',
    medal: '',
    level: '',
    organizer: '',
    date: ''
  })

  // Delete Actions
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [selectedId, setSelectedId] = useState<number>(0)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleOpenDialog = (id: number) => {
    setSelectedId(id)
    setOpenDialog(true)
  }

  // Crud Operations
  const handleDeleteData = async () => {
    setIsLoading(true)

    try {
      const res = await deleteAchievementById(selectedId)

      setIsLoading(false)
      setOpenDialog(false)

      if (res.statusCode === 200) {
        toast.success(`Berhasil menghapus data!`)

        return
      }

      toast.error(`Gagal menghapus data!`)
    } catch (error) {
      setIsLoading(false)
      setOpenDialog(false)

      toast.error(`Gagal menghapus data!`)
    }
  }

  const handleUpdate = async (val: AddAchievementType, id: number) => {
    setIsLoading(true)

    try {
      const res = await updateAchievement(id, val)

      setIsLoading(false)
      setOpenDialog(false)

      if (res.statusCode === 200) {
        toast.success(`Berhasil mengupdate data!`)

        return
      }

      toast.error(`Gagal mengupdate data! ${res.result.response.message[0]}`)
    } catch (error) {
      setIsLoading(false)
      setOpenDialog(false)

      toast.error(`Gagal mengupdate data!`)
    }
  }

  const handleOpenUpdateDrawer = async (id: number) => {
    const selectedData = await getAchievementById(id)

    setSelectedDataById(selectedData.result as any)

    setUpdateAchievementOpen(true)
  }

  const handleCreate = async (data: AddAchievementType) => {
    const { title, category, level, medal, organizer, date } = data

    setIsLoading(true)

    try {
      const res = await createAchievements({
        title,
        category,
        level,
        medal,
        organizer,
        date: date?.toISOString() as string,
        studentId
      })

      setIsLoading(false)
      setOpenDialog(false)

      if (res.statusCode === 201) {
        toast.success(`Berhasil menambah data!`)

        return
      }

      toast.error(`Gagal menambah data! ${res.result.response.message[0]}`)
    } catch (error) {
      setIsLoading(false)
      setOpenDialog(false)

      toast.error(`Gagal menambah data!`)
    }
  }

  // End Crud

  const columns = useMemo<ColumnDef<AchievementTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('title', {
        header: 'Nama Kejuaraan',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.title}
          </Typography>
        )
      }),
      columnHelper.accessor('category', {
        header: 'Kategori',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.category}
          </Typography>
        )
      }),
      columnHelper.accessor('medal', {
        header: 'Predikat Juara',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.medal}
          </Typography>
        )
      }),
      columnHelper.accessor('level', {
        header: 'Tingkat',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.level}
          </Typography>
        )
      }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <Tooltip title='Delete'>
              <IconButton onClick={() => handleOpenDialog(row.original.id)}>
                <i className='tabler-trash text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton onClick={() => handleOpenUpdateDrawer(row.original.id)}>
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            </Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableData]
  )

  const table = useReactTable({
    data: tableData as AchievementType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
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
        <CardHeader title='Data Jenjang' className='pbe-4' />
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
              placeholder='Cari Jenjang'
              className='max-sm:is-full'
            />
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setAddAchievementOpen(!addAchievementOpen)}
              className='max-sm:is-full'
            >
              Tambah Jenjang
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
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />
      </Card>
      <AddAchievementDrawer
        open={addAchievementOpen}
        isLoading={isLoading}
        handleClose={() => setAddAchievementOpen(!addAchievementOpen)}
        handleCreate={handleCreate}
      />
      <UpdateAchievementDrawer
        open={updateAchievementOpen}
        selectedData={selectedDataById}
        isLoading={isLoading}
        handleClose={() => setUpdateAchievementOpen(!updateAchievementOpen)}
        handleUpdate={(val, id) => handleUpdate(val, id)}
      />
      <DeleteDialog
        open={openDialog}
        isLoading={isLoading}
        handleClose={() => setOpenDialog(false)}
        handleSubmit={handleDeleteData}
      />
    </>
  )
}

export default AchievementListTable
