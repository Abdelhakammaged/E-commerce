import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    refreshToken: string;
    // أي fields أخرى بترجعها من الـ JWT
  };
}
@ApiTags('Auth') // group endpoints in Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register new user' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login user' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth('access-token') // ← only on protected routes
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.sub);
  }

  @ApiBearerAuth('refresh-token') // ← غير ده
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @Post('refresh')
  refreshTokens(@Req() req: RequestWithUser) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
  }
}
