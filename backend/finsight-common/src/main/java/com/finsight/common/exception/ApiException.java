package com.finsight.common.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public class ApiException extends RuntimeException {

    private final int status;
    private final String code;
    private final Object details;

    public ApiException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = null;
    }

    public ApiException(int status, String code, String message, Object details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(400, "BAD_REQUEST", message);
    }

    public static ApiException badRequest(String message, Object details) {
        return new ApiException(400, "BAD_REQUEST", message, details);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(401, "UNAUTHORIZED", message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(403, "FORBIDDEN", message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(404, "NOT_FOUND", message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(409, "CONFLICT", message);
    }

    public static ApiException conflict(String message, Object details) {
        return new ApiException(409, "CONFLICT", message, details);
    }

    public static ApiException internal(String message) {
        return new ApiException(500, "INTERNAL_ERROR", message);
    }

    public static ApiException serviceUnavailable(String message) {
        return new ApiException(503, "SERVICE_UNAVAILABLE", message);
    }
}
