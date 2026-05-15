package kz.car.maintenance.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void returnsBadRequestForNonMultipartUploadRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/files/upload");

        Map<String, Object> body = handler.handleMultipartException(
                new MultipartException("Current request is not a multipart request"),
                request
        ).getBody();

        assertThat(body).isNotNull();
        assertThat(body.get("status")).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(body.get("error")).isEqualTo(HttpStatus.BAD_REQUEST.getReasonPhrase());
        assertThat(body.get("message")).isEqualTo("Upload request must be sent as multipart/form-data");
        assertThat(body.get("path")).isEqualTo("/api/files/upload");
    }

    @Test
    void returnsBadRequestForMissingUploadPart() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/files/upload");

        Map<String, Object> body = handler.handleMissingPart(
                new MissingServletRequestPartException("file"),
                request
        ).getBody();

        assertThat(body).isNotNull();
        assertThat(body.get("status")).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(body.get("message")).isEqualTo("Missing upload part: file");
        assertThat(body.get("path")).isEqualTo("/api/files/upload");
    }
}
