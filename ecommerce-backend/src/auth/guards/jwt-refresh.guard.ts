import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err, user, info, context) {
    console.log('Guard Error:', err);
    console.log('Guard User:', user);
    console.log('Guard Info:', info?.message);
    return super.handleRequest(err, user, info, context);
  }
}
