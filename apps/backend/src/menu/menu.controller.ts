import { Controller, Get, Param, Post, Body, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/guards/roles.decorator';
import { Role, Prisma, CustomizationType } from '@prisma/client';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all menu items with filters (public)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isVegetarian', required: false, type: Boolean })
  @ApiQuery({ name: 'isVegan', required: false, type: Boolean })
  @ApiQuery({ name: 'isGlutenFree', required: false, type: Boolean })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiResponse({ status: 200, description: 'Paginated list of menu items' })
  async getAllMenuItems(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('isVegetarian') isVegetarian?: string,
    @Query('isVegan') isVegan?: string,
    @Query('isGlutenFree') isGlutenFree?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      categoryId,
      search,
      isVegetarian: isVegetarian === 'true',
      isVegan: isVegan === 'true',
      isGlutenFree: isGlutenFree === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };
    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    };
    return this.menuService.findAll(filters, pagination);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all menu items for admin (including unavailable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of all menu items' })
  async getAllMenuItemsForAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
    };
    return this.menuService.findAllForAdmin(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get menu item by ID (public)' })
  @ApiResponse({ status: 200, description: 'Menu item details' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async getMenuItemById(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get menu item by slug (public)' })
  @ApiResponse({ status: 200, description: 'Menu item details' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async getMenuItemBySlug(@Param('slug') slug: string) {
    return this.menuService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new menu item (admin only)' })
  @ApiResponse({ status: 201, description: 'Menu item created' })
  async createMenuItem(@Body() data: Prisma.MenuItemCreateInput) {
    return this.menuService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu item (admin only)' })
  @ApiResponse({ status: 200, description: 'Menu item updated' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async updateMenuItem(@Param('id') id: string, @Body() data: Prisma.MenuItemUpdateInput) {
    return this.menuService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu item (admin only)' })
  @ApiResponse({ status: 200, description: 'Menu item deleted' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async deleteMenuItem(@Param('id') id: string) {
    return this.menuService.delete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':menuItemId/customization-groups')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create customization group for menu item (admin only)' })
  @ApiResponse({ status: 201, description: 'Customization group created' })
  async createCustomizationGroup(
    @Param('menuItemId') menuItemId: string,
    @Body() data: { name: string; type: string; isRequired?: boolean; minSelections?: number; maxSelections?: number; sortOrder?: number },
  ) {
    return this.menuService.createCustomizationGroup({ ...data, menuItemId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('customization-groups/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update customization group (admin only)' })
  @ApiResponse({ status: 200, description: 'Customization group updated' })
  async updateCustomizationGroup(
    @Param('id') id: string,
    @Body() data: { name?: string; type?: string; isRequired?: boolean; minSelections?: number; maxSelections?: number; sortOrder?: number },
  ) {
    return this.menuService.updateCustomizationGroup(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('customization-groups/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete customization group (admin only)' })
  @ApiResponse({ status: 200, description: 'Customization group deleted' })
  async deleteCustomizationGroup(@Param('id') id: string) {
    return this.menuService.deleteCustomizationGroup(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('customization-groups/:groupId/options')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create customization option (admin only)' })
  @ApiResponse({ status: 201, description: 'Customization option created' })
  async createCustomizationOption(
    @Param('groupId') groupId: string,
    @Body() data: { name: string; priceModifier?: number; isDefault?: boolean; sortOrder?: number },
  ) {
    return this.menuService.createCustomizationOption({ ...data, groupId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('customization-options/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update customization option (admin only)' })
  @ApiResponse({ status: 200, description: 'Customization option updated' })
  async updateCustomizationOption(
    @Param('id') id: string,
    @Body() data: { name?: string; priceModifier?: number; isDefault?: boolean; sortOrder?: number },
  ) {
    return this.menuService.updateCustomizationOption(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('customization-options/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete customization option (admin only)' })
  @ApiResponse({ status: 200, description: 'Customization option deleted' })
  async deleteCustomizationOption(@Param('id') id: string) {
    return this.menuService.deleteCustomizationOption(id);
  }
}
