'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'
import { Chip } from '@mui/material'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars

interface Props {
  data: {
    subjectName: string
    subjectCode: string
    data: number[]
  }
}

const SubjectLineChart = ({ data }: Props) => {
  const series = [{ data: data.data.filter(val => val !== 0) }]

  console.log(data)

  // Hooks
  const theme = useTheme()

  // Vars
  const infoColor = 'var(--mui-palette-info-main)'

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      strokeDashArray: 6,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: {
        lines: { show: true }
      },
      yaxis: {
        lines: { show: false }
      },
      padding: {
        top: -20,
        left: -5,
        right: 10,
        bottom: -10
      }
    },
    stroke: {
      width: 3,
      lineCap: 'butt',
      curve: 'straight'
    },
    colors: [infoColor],
    markers: {
      size: 4,
      strokeWidth: 3,
      colors: infoColor,
      strokeColors: 'transparent',
      discrete: [
        {
          size: 5.5,
          seriesIndex: 0,
          strokeColor: infoColor,
          fillColor: 'var(--mui-palette-background-paper)',
          dataPointIndex: series[0].data.length - 1
        }
      ]
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      labels: { show: false }
    },
    responsive: [
      {
        breakpoint: theme.breakpoints.values.lg,
        options: {
          chart: { height: 68 }
        }
      },
      {
        breakpoint: theme.breakpoints.values.md,
        options: {
          chart: { height: 98 }
        }
      },
      {
        breakpoint: 430,
        options: {
          chart: { height: 114 }
        }
      }
    ]
  }

  return (
    <>
      {!data.data.every(val => val === 0) && (
        <Card variant='outlined'>
          <CardHeader title={data.subjectCode} subheader={data.subjectName} className='pbe-0' />
          <CardContent className='flex flex-col gap-3 pbs-3'>
            <AppReactApexCharts type='line' height={68} width='100%' options={options} series={series} />
            <div className='flex flex-col items-center justify-between flex-wrap gap-x-4 gap-y-0.5 mt-2'>
              <Chip
                icon={<i className='tabler-circle-plus' />}
                label={Math.max(...series[0].data)}
                color='success'
                variant='tonal'
                size='small'
              />

              <Chip
                icon={<i className='tabler-circle-minus' />}
                label={Math.min(...series[0].data)}
                color='error'
                variant='tonal'
                size='small'
              />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default SubjectLineChart
