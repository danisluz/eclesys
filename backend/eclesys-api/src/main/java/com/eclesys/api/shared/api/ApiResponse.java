package com.eclesys.api.shared.api;

public class ApiResponse<T> {
  public String status;
  public T data;
  public String message;

  public static <T> ApiResponse<T> success(T data) {
    ApiResponse<T> response = new ApiResponse<>();
    response.status = "success";
    response.data = data;
    return response;
  }

  public static <T> ApiResponse<T> error(String message) {
    ApiResponse<T> response = new ApiResponse<>();
    response.status = "error";
    response.message = message;
    return response;
  }
}
