import { CircularProgress } from '@mui/material'

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className='grid place-content-center'>
      <CircularProgress />
    </div>
  )
}
