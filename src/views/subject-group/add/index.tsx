'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Grid from '@mui/material/Grid'

// Third-party Imports
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'

// Component Imports
import SubjectGroupAddListTable from './SubjectGroupAddListTable'
import AddActions from './AddActions'
import AddSubjectGroupForm from './AddSubjectGroupForm'
import { fetchLessonYears } from '@/libs/actions/lessonYears'
import { fetchGrades } from '@/libs/actions/grades'

import { createSubjectGroup } from '@/libs/actions/subjectGroups'
import { fetchSubjects } from '@/libs/actions/subjects'
import { createSubjectsToSubjectGroup } from '@/libs/actions/subjectsToSubjectGroups'

type FormValues = {
  lessonYearId: number | string
  gradeId: number | string
  name: string
}

const SubjectGroupAddList = () => {
  const { push } = useRouter()

  const [lessonYearData, setLessonYearData] = useState([])
  const [gradeData, setGradeData] = useState([])
  const [subjectData, setSubjectData] = useState([])

  const [selectedSubjects, setSelectedSubjects] = useState([])

  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    async function fetchData() {
      const lessonYearRes = await fetchLessonYears()
      const gradeRes = await fetchGrades()
      const subjectRes = await fetchSubjects()

      setLessonYearData(lessonYearRes.result)
      setGradeData(gradeRes.result)
      setSubjectData(subjectRes.result)
    }

    fetchData()
  }, [])

  // Hooks
  const {
    control,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      lessonYearId: '',
      gradeId: '',
      name: ''
    }
  })

  const onSubmit = async (data: FormValues) => {
    const mappedSubjectData = selectedSubjects.map((subject: { name: string; subjectOrder: number }) => {
      const filteredData: { id: number }[] = subjectData.filter((value: { name: string }) => value.name == subject.name)

      return {
        subjectOrder: Number(subject.subjectOrder),
        id: filteredData[0].id
      }
    })

    setIsLoading(true)

    try {
      const subjectGroupRes = await createSubjectGroup(data)

      if (subjectGroupRes.statusCode === 201) {
        await Promise.all(
          mappedSubjectData.map(async data => {
            await createSubjectsToSubjectGroup({
              subjectOrder: data.subjectOrder,
              subjectId: data.id,
              subjectGroupId: subjectGroupRes.result.id
            })
          })
        )
          .then(() => {
            toast.success(`Berhasil menambahkan data!`)
            setIsLoading(false)
            push('/setting/subject-group/list')
          })
          .catch(() => {
            toast.error(`Gagal menambahkan data! Silakan hubungi Admin!`)
            setIsLoading(false)
          })

        setIsLoading(false)

        return
      }

      setIsLoading(false)

      toast.error(`Gagal menambahkan data! ${subjectGroupRes.message}`)
    } catch (error) {
      setIsLoading(false)

      toast.error(`Gagal menambahkan data! Silakan hubungi Admin!`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={6}>
        <Grid item xs={12} md={9}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <AddSubjectGroupForm
                control={control}
                errors={errors}
                lessonYearData={lessonYearData}
                gradeData={gradeData}
              />
            </Grid>
            <Grid item xs={12}>
              <SubjectGroupAddListTable
                selectedSubjects={selectedSubjects}
                setSelectedSubjects={setSelectedSubjects}
                setError={setError}
                errors={errors}
                clearErrors={clearErrors}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={3}>
          <AddActions isLoading={isLoading} reset={reset} />
        </Grid>
      </Grid>
    </form>
  )
}

export default SubjectGroupAddList
