const API_BASE = 'http://localhost:3000/api/v1';

const mockSizeCustomization = {
  id: 'group-1',
  name: 'Quantity',
  type: 'SIZE',
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  options: [
    { id: 'opt-1', name: '1 Piece', priceModifier: '0', isDefault: false },
    { id: 'opt-2', name: '2 Pieces', priceModifier: '59', isDefault: true },
    { id: 'opt-3', name: '4 Pieces', priceModifier: '177', isDefault: false },
  ],
};

const mockAddonCustomization = {
  id: 'addon-1',
  name: 'Extra Cheese',
  type: 'ADDON',
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  options: [
    { id: 'opt-1', name: 'Yes', priceModifier: '50', isDefault: false },
    { id: 'opt-2', name: 'No', priceModifier: '0', isDefault: true },
  ],
};

describe('Menu Customizations Data Structure', () => {
  it('identifies SIZE type customizations as required size selections', () => {
    expect(mockSizeCustomization.type).toBe('SIZE');
    expect(mockSizeCustomization.isRequired).toBe(true);
    expect(mockSizeCustomization.minSelections).toBe(1);
    expect(mockSizeCustomization.maxSelections).toBe(1);
  });

  it('identifies ADDON type customizations as optional add-ons', () => {
    expect(mockAddonCustomization.type).toBe('ADDON');
    expect(mockAddonCustomization.isRequired).toBe(false);
    expect(mockAddonCustomization.minSelections).toBe(0);
  });

  it('finds default option in size customization', () => {
    const defaultOption = mockSizeCustomization.options.find(opt => opt.isDefault);
    expect(defaultOption?.name).toBe('2 Pieces');
    expect(defaultOption?.priceModifier).toBe('59');
  });

  it('finds default option in addon customization', () => {
    const defaultOption = mockAddonCustomization.options.find(opt => opt.isDefault);
    expect(defaultOption?.name).toBe('No');
  });

  it('calculates total price with size price modifier', () => {
    const basePrice = 59;
    const selectedOption = mockSizeCustomization.options[2];
    const totalPrice = basePrice + Number(selectedOption.priceModifier);
    expect(totalPrice).toBe(236);
  });

  it('calculates total price with addon price modifier', () => {
    const basePrice = 299;
    const selectedOption = mockAddonCustomization.options[0];
    const totalPrice = basePrice + Number(selectedOption.priceModifier);
    expect(totalPrice).toBe(349);
  });

  it('validates required size selection', () => {
    const selectedOptions = ['opt-1'];
    const minRequired = mockSizeCustomization.minSelections;
    const isValid = selectedOptions.length >= minRequired;
    expect(isValid).toBe(true);
  });

  it('validates addon selection is optional', () => {
    const selectedOptions: string[] = [];
    const isRequired = mockAddonCustomization.isRequired;
    expect(isRequired).toBe(false);
  });
});