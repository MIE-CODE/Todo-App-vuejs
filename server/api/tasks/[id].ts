import { updateTaskSchema } from '#features/tasks/schemas/task'
import { requireEntitlement, requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { notFoundError } from '../../utils/errors'
import { parseOrThrow } from '../../utils/validate'
import { createTaskService } from '../../services/taskService'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const service = createTaskService()
  const taskId = getRouterParam(event, 'id')

  if (!taskId) {
    throw notFoundError('Task id is required')
  }

  if (event.method === 'GET') {
    const task = await service.get(user.id, taskId)

    if (!task) {
      throw notFoundError('Task not found')
    }

    return task
  }

  if (event.method === 'PATCH') {
    assertCsrf(event)
    const body = parseOrThrow(updateTaskSchema, await readBody(event))

    if (body.dueTime) {
      await requireEntitlement(
        event,
        'task_reminders',
        'Due times and task alarms require an active Plus or Pro plan.'
      )
    }

    return service.update(user.id, taskId, body)
  }

  if (event.method === 'DELETE') {
    assertCsrf(event)
    await service.remove(user.id, taskId)
    setResponseStatus(event, 204)
    return null
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
