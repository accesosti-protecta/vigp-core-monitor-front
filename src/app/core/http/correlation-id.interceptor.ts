import { HttpInterceptorFn } from '@angular/common/http';
import { CORRELATION_ID, newCorrelationId } from './correlation.context';

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const id = newCorrelationId();
  return next(
    req.clone({
      setHeaders: { 'X-Correlation-Id': id },
      context: req.context.set(CORRELATION_ID, id),
    }),
  );
};
