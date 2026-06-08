const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parse page/limit from a query string object and return
 * validated pagination values along with the Mongoose skip value.
 */
export function parsePagination(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  let page = Number(query.page) || DEFAULT_PAGE;
  let limit = Number(query.limit) || DEFAULT_LIMIT;

  if (page < 1) page = DEFAULT_PAGE;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build a standard paginated response envelope.
 */
export function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true as const,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
