/**
 * Tasks resource for task management operations
 *
 * @module resources/tasks
 */

import type {
  AvailableRidersRequest,
  AvailableRidersResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  DisputeRequest,
  DisputeTaskResponse,
  GetTaskResponse,
  ListTasksRequest,
  ListTasksResponse,
  ManualAssignRequest,
  ManualAssignResponse,
  RatingRequest,
  SubmitRatingResponse,
  TaskListItem,
  TaskQuoteRequest,
  TaskQuoteResponse,
} from '../types';
import type { HttpClient } from '../utils/http';

/**
 * Tasks resource providing task management operations
 */
export class Tasks {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get pricing quote for a task without creating it
   *
   * @param request - Task quote request
   * @returns Pricing breakdown with estimates
   *
   * @example
   * ```typescript
   * const quote = await relay.tasks.quote({
   *   taskType: 'PACKAGE_DELIVERY',
   *   stages: [
   *     {
   *       type: 'PICKUP',
   *       location: { latitude: 6.5244, longitude: 3.3792, address: 'Pickup' },
   *       instructions: 'Call on arrival',
   *       items: [{ name: 'Package', estimatedValue: 500000, estimatedWeight: 'STANDARD', estimatedSize: 'BOX' }],
   *     },
   *     {
   *       type: 'DROPOFF',
   *       location: { latitude: 6.4281, longitude: 3.4219, address: 'Dropoff' },
   *       instructions: 'Leave at reception',
   *     },
   *   ],
   * });
   *
   * console.log(`Estimated cost: ₦${quote.total / 100}`);
   * ```
   */
  async quote(request: TaskQuoteRequest): Promise<TaskQuoteResponse> {
    return this.http.post<TaskQuoteResponse>('/sdk/tasks/quote', request);
  }

  /**
   * Create a new delivery task
   *
   * @param request - Task creation request
   * @param options - Additional options (idempotency key, etc.)
   * @returns Created task with pricing
   *
   * @example
   * ```typescript
   * const task = await relay.tasks.create({
   *   taskType: 'PACKAGE_DELIVERY',
   *   priority: 'URGENT',
   *   stages: [
   *     {
   *       type: 'PICKUP',
   *       location: {
   *         latitude: 6.5244,
   *         longitude: 3.3792,
   *         address: '123 Main St, Lagos',
   *       },
   *       instructions: 'Ring doorbell',
   *       items: [
   *         {
   *           name: 'Package',
   *           estimatedWeight: 'STANDARD',
   *           estimatedSize: 'BOX',
   *           estimatedValue: 5000000,
   *         },
   *       ],
   *     },
   *     {
   *       type: 'DROPOFF',
   *       location: { latitude: 6.4281, longitude: 3.4219, address: 'Dropoff address' },
   *       instructions: 'Call receiver',
   *     },
   *   ],
   * }, {
   *   idempotencyKey: 'order-12345-delivery',
   * });
   *
   * console.log(`Task created: ${task.task.taskId}`);
   * console.log(`Status: ${task.task.status}`);
   * console.log(`Total cost: ₦${task.task.totalFee / 100}`);
   * ```
   */
  async create(
    request: CreateTaskRequest,
    options?: { idempotencyKey?: string },
  ): Promise<CreateTaskResponse> {
    const headers: Record<string, string> = {};
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return this.http.post<CreateTaskResponse>('/sdk/tasks', request, { headers });
  }

  /**
   * List tasks with pagination and filtering
   *
   * @param request - List request with filters
   * @returns Paginated task list
   *
   * @example
   * ```typescript
   * const tasks = await relay.tasks.list({ limit: 30, order: 'desc' });
   *
   * for (const task of tasks.data) {
   *   console.log(task.id, task.status);
   * }
   *
   * // Pagination
   * if (tasks.hasMore) {
   *   const nextPage = await relay.tasks.list({
   *     cursor: tasks.cursor,
   *     limit: 50,
   *   });
   * }
   * ```
   */
  async list(request?: ListTasksRequest): Promise<ListTasksResponse> {
    return this.http.get<ListTasksResponse>('/sdk/tasks', { params: request });
  }

  /**
   * List all tasks with automatic pagination
   *
   * Returns an async iterator that automatically handles pagination,
   * allowing you to iterate over all tasks without manual cursor management.
   *
   * @param request - List request with filters
   * @returns Async iterator for all tasks
   *
   * @example
   * ```typescript
   * for await (const task of relay.tasks.listAll({ limit: 30 })) {
   *   console.log(`${task.id}: ₦${task.totalFee / 100}`);
   * }
   * ```
   */
  async *listAll(request?: ListTasksRequest): AsyncIterableIterator<TaskListItem> {
    let cursor: string | undefined;

    do {
      const response = await this.list({ ...request, cursor });

      for (const task of response.data) {
        yield task;
      }

      cursor = response.hasMore ? response.cursor : undefined;
    } while (cursor);
  }

  /**
   * Get task by ID
   *
   * @param taskId - Task ID
   * @returns Task details
   *
   * @example
   * ```typescript
   * const task = await relay.tasks.get('task-123');
   * if ('task' in task) {
   *   console.log(task.task.status, task.task.riderId);
   * } else {
   *   console.log(task.status, task.rider.id);
   * }
   * ```
   */
  async get(taskId: string): Promise<GetTaskResponse> {
    return this.http.get<GetTaskResponse>(`/sdk/tasks/${taskId}`);
  }

  /**
   * Cancel a task
   *
   * Cancels the task and refunds the delivery fee to your wallet.
   * Only tasks in PENDING, OFFERED, or ASSIGNED status can be cancelled.
   *
   * @param taskId - Task ID
   * @param request - Cancellation details (optional)
   * @returns Cancellation status
   *
   * @example
   * ```typescript
   * await relay.tasks.cancel('task-123', {
   *   reason: 'Customer requested cancellation',
   * });
   * ```
   */
  async cancel(taskId: string, request?: CancelTaskRequest): Promise<CancelTaskResponse> {
    return this.http.delete<CancelTaskResponse>(`/sdk/tasks/${taskId}/cancel`, { data: request });
  }

  /**
   * Manually assign task to specific rider
   *
   * Only works for tasks with autoAssign: false and status: PENDING
   *
   * @param taskId - Task ID
   * @param request - Assignment details
   * @returns Assignment status
   *
   * @example
   * ```typescript
   * await relay.tasks.assign('task-123', {
   *   riderId: 'rider-456',
   * });
   * ```
   */
  async assign(taskId: string, request: ManualAssignRequest): Promise<ManualAssignResponse> {
    return this.http.post<ManualAssignResponse>(`/sdk/tasks/${taskId}/assign`, request);
  }

  /**
   * Submit rating for completed task
   *
   * @param taskId - Task ID
   * @param request - Rating details
   * @returns Rating confirmation
   *
   * @example
   * ```typescript
   * await relay.tasks.rate('task-123', {
   *   rating: 5,
   *   comment: 'Excellent service, very professional!',
   * });
   * ```
   */
  async rate(taskId: string, request: RatingRequest): Promise<SubmitRatingResponse> {
    return this.http.post<SubmitRatingResponse>(`/sdk/tasks/${taskId}/ratings`, request);
  }

  /**
   * Dispute a task
   *
   * Opens a dispute for a completed task within the dispute window (default 24h).
   * Freezes payment pending admin review.
   *
   * @param taskId - Task ID
   * @param request - Dispute details
   * @returns Dispute confirmation
   *
   * @example
   * ```typescript
   * const dispute = await relay.tasks.dispute('task-123', {
   *   reason: 'DAMAGED_ITEMS',
   *   description: 'Package arrived with visible damage to contents',
   *   evidence: [
   *     'https://example.com/photo1.jpg',
   *     'https://example.com/photo2.jpg',
   *   ],
   * });
   *
   * console.log(dispute.disputeId, dispute.status);
   * ```
   */
  async dispute(taskId: string, request: DisputeRequest): Promise<DisputeTaskResponse> {
    return this.http.post<DisputeTaskResponse>(`/sdk/tasks/${taskId}/dispute`, request);
  }

  /**
   * Get available riders for task location
   *
   * Returns a list of online riders near the pickup location who meet
   * the task requirements.
   *
   * @param taskId - Task ID
   * @param request - Filter options
   * @returns List of available riders
   *
   * @example
   * ```typescript
   * const result = await relay.tasks.availableRiders('task-123', {
   *   tier: 1,
   * });
   *
   * for (const rider of result) {
   *   console.log(rider.riderId, rider.firstName, rider.rating.average);
   * }
   * ```
   */
  async availableRiders(
    taskId: string,
    request?: AvailableRidersRequest,
  ): Promise<AvailableRidersResponse> {
    return this.http.get<AvailableRidersResponse>(`/sdk/tasks/${taskId}/available-riders`, {
      params: request,
    });
  }
}
