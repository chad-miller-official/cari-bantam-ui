export type Csrf = {
  headerName: string,
  token: string,
  parameterName: string,
}

export type Sort = {
  empty: boolean,
  sorted: boolean,
  unsorted: boolean,
}

export type Pageable = {
  offset: number,
  pageNumber: number,
  pageSize: number,
  paged: boolean,
  sort: Sort,
  unpaged: boolean,
}

export type Page<T> = {
  content: T[],
  page: {
    number: number,
    size: number,
    totalElements: number,
    totalPages: number,
  },
  empty: boolean,
  first: boolean,
  last: boolean,
  numberOfElements: number,
  pageable: Pageable,
  sort: Sort,
}