import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import updateReference from '@/features/reference/handlers/update-reference'
import getReference from '@/features/reference/handlers/get-reference'

const router = Router()

router.put('/reference/:id', createApiHandler(updateReference))
router.get('/reference/:id', createApiHandler(getReference))

export default router
