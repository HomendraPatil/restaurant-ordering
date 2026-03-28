import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuRepository, MenuFilters, PaginationParams } from './menu.repository';
import { Prisma, CustomizationType } from '@prisma/client';

function mapTypeToFrontend(type: CustomizationType): 'SINGLE' | 'MULTIPLE' | 'TEXT' {
  switch (type) {
    case 'SIZE':
      return 'SINGLE';
    case 'ADDON':
      return 'MULTIPLE';
    case 'TEXT':
      return 'TEXT';
    default:
      return 'SINGLE';
  }
}

function mapCustomizationGroups(groups: any[]): any[] {
  return groups.map(group => ({
    ...group,
    type: mapTypeToFrontend(group.type),
  }));
}

@Injectable()
export class MenuService {
  constructor(private menuRepository: MenuRepository) {}

  async findAll(filters?: MenuFilters, pagination?: PaginationParams) {
    const result = await this.menuRepository.findAll(filters, pagination);
    return {
      ...result,
      items: result.items.map(item => ({
        ...item,
        customizations: mapCustomizationGroups(item.customizations as any[]),
      })),
    };
  }

  async findAllForAdmin(pagination?: PaginationParams) {
    const result = await this.menuRepository.findAllForAdmin(pagination);
    return {
      ...result,
      items: result.items.map(item => ({
        ...item,
        customizations: mapCustomizationGroups(item.customizations as any[]),
      })),
    };
  }

  async findById(id: string) {
    const item = await this.menuRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return {
      ...item,
      customizations: mapCustomizationGroups(item.customizations as any[]),
    };
  }

  async findBySlug(slug: string) {
    const item = await this.menuRepository.findBySlug(slug);
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return {
      ...item,
      customizations: mapCustomizationGroups(item.customizations as any[]),
    };
  }

  async create(data: Prisma.MenuItemCreateInput) {
    return this.menuRepository.create(data);
  }

  async update(id: string, data: Prisma.MenuItemUpdateInput) {
    await this.findById(id);
    return this.menuRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.menuRepository.softDelete(id);
  }

  async createCustomizationGroup(data: {
    menuItemId: string;
    name: string;
    type: CustomizationType | string;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
  }) {
    await this.findById(data.menuItemId);
    const type = typeof data.type === 'string' 
      ? data.type as CustomizationType 
      : data.type;
    const result = await this.menuRepository.createCustomizationGroup({ ...data, type });
    return {
      ...result,
      type: mapTypeToFrontend(result.type),
    };
  }

  async updateCustomizationGroup(id: string, data: {
    name?: string;
    type?: CustomizationType | string;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
  }) {
    const group = await this.menuRepository.getCustomizationGroupById(id);
    if (!group) {
      throw new NotFoundException('Customization group not found');
    }
    const updateData = { ...data };
    if (data.type && typeof data.type === 'string') {
      updateData.type = data.type as CustomizationType;
    }
    const result = await this.menuRepository.updateCustomizationGroup(id, updateData);
    return {
      ...result,
      type: mapTypeToFrontend(result.type),
    };
  }

  async deleteCustomizationGroup(id: string) {
    const group = await this.menuRepository.getCustomizationGroupById(id);
    if (!group) {
      throw new NotFoundException('Customization group not found');
    }
    return this.menuRepository.deleteCustomizationGroup(id);
  }

  async createCustomizationOption(data: {
    groupId: string;
    name: string;
    priceModifier?: number;
    isDefault?: boolean;
    sortOrder?: number;
  }) {
    const group = await this.menuRepository.getCustomizationGroupById(data.groupId);
    if (!group) {
      throw new NotFoundException('Customization group not found');
    }
    return this.menuRepository.createCustomizationOption(data);
  }

  async updateCustomizationOption(id: string, data: {
    name?: string;
    priceModifier?: number;
    isDefault?: boolean;
    sortOrder?: number;
  }) {
    const option = await this.menuRepository.getCustomizationOptionById(id);
    if (!option) {
      throw new NotFoundException('Customization option not found');
    }
    return this.menuRepository.updateCustomizationOption(id, data);
  }

  async deleteCustomizationOption(id: string) {
    const option = await this.menuRepository.getCustomizationOptionById(id);
    if (!option) {
      throw new NotFoundException('Customization option not found');
    }
    return this.menuRepository.deleteCustomizationOption(id);
  }
}
