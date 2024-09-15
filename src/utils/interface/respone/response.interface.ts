export interface ResponseSuccess {
  status: string;
  message: string;
  data?: any;
}

export interface ResponsePagination extends ResponseSuccess {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    total_page?: number;
    current_page?: number;
  };
}
