import { bulkTaskActionSchema } from '#features/tasks/schemas/task'
import { createTaskService } from '../../services/taskService'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { parseOrThrow } from '../../utils/validate'

/**
 * Bulk complete / delete / move for multi-select on the kanban board.
 * POST keeps a single CSRF-protected mutation surface.
 */
export default defineApiHandler(async (event) => {
  assertCsrf(event)
  const user = await requireUser(event)
  const body = parseOrThrow(bulkTaskActionSchema, await readBody(event))
  const service = createTaskService()
  return service.bulk(user.id, body)
})
