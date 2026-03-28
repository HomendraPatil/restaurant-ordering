import { Controller, Get, Param, Post, Body, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive categories (admin only)' })
  @ApiResponse({ status: 200, description: 'List of categories (paginated if page/limit provided)' })
  async getAllCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const pagination = page || limit ? {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      includeInactive: includeInactive === 'true',
    } : { includeInactive: includeInactive === 'true' };
    return this.categoryService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID (public)' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug (public)' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@Body() data: { name: string; description?: string; slug: string; imageUrl?: string; sortOrder?: number }) {
    return this.categoryService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string; imageUrl?: string; sortOrder?: number; isActive?: boolean },
  ) {
    return this.categoryService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
