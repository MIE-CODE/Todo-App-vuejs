import { createTaskSchema, taskListQuerySchema } from '#features/tasks/schemas/task'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { parseOrThrow } from '../../utils/validate'
import { createTaskService } from '../../services/taskService'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const service = createTaskService()

  if (event.method === 'GET') {
    const query = parseOrThrow(taskListQuerySchema, getQuery(event))
    return service.list(user.id, query)
  }

  if (event.method === 'POST') {
    assertCsrf(event)
    const body = parseOrThrow(createTaskSchema, await readBody(event))
    setResponseStatus(event, 201)
    return service.create(user.id, body)
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
