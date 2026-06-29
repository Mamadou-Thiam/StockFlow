import mongoose from 'mongoose';
import { Company, User, Category, Product } from './models';
import config from './config';

export async function autoSeed(): Promise<void> {
  const existingCompany = await Company.findOne({ email: config.superAdmin.email });
  if (existingCompany) return;

  console.log('Création des données de démonstration...');

  const company = await Company.create({
    name: 'Stockflow Démo',
    email: config.superAdmin.email,
    phone: '+221 33 123 45 67',
    address: {
      street: '123 Rue Principale',
      city: 'Dakar',
      state: 'Dakar',
      zip: '12000',
      country: 'Sénégal',
    },
    colors: { primary: '#1677ff', secondary: '#52c41a' },
    isActive: true,
  });

  await User.create({
    companyId: company._id,
    firstName: 'Super',
    lastName: 'Admin',
    email: config.superAdmin.email,
    password: config.superAdmin.password,
    role: 'super_admin',
    isActive: true,
  });

  const categories = await Category.insertMany([
    { companyId: company._id, name: 'Électronique', description: 'Produits électroniques', color: '#1677ff' },
    { companyId: company._id, name: 'Vêtements', description: 'Vêtements et accessoires', color: '#52c41a' },
    { companyId: company._id, name: 'Alimentation', description: 'Produits alimentaires', color: '#faad14' },
    { companyId: company._id, name: 'Fournitures', description: 'Fournitures de bureau', color: '#722ed1' },
  ]);

  await Product.insertMany([
    { companyId: company._id, name: 'Ordinateur Portable Pro', sku: 'ELEC-001', categoryId: categories[0]._id, price: 850000, costPrice: 600000, quantity: 15, minStock: 3, unit: 'pcs', taxRate: 18 },
    { companyId: company._id, name: 'Smartphone X200', sku: 'ELEC-002', categoryId: categories[0]._id, price: 350000, costPrice: 250000, quantity: 30, minStock: 5, unit: 'pcs', taxRate: 18 },
    { companyId: company._id, name: 'Casque Audio Bluetooth', sku: 'ELEC-003', categoryId: categories[0]._id, price: 45000, costPrice: 25000, quantity: 50, minStock: 10, unit: 'pcs', taxRate: 18 },
    { companyId: company._id, name: 'T-shirt Coton Premium', sku: 'VET-001', categoryId: categories[1]._id, price: 12000, costPrice: 6000, quantity: 100, minStock: 20, unit: 'pcs', taxRate: 18 },
    { companyId: company._id, name: 'Jean Slim Fit', sku: 'VET-002', categoryId: categories[1]._id, price: 25000, costPrice: 14000, quantity: 60, minStock: 10, unit: 'pcs', taxRate: 18 },
    { companyId: company._id, name: 'Riz Parfumé 5kg', sku: 'ALIM-001', categoryId: categories[2]._id, price: 4500, costPrice: 3500, quantity: 200, minStock: 50, unit: 'sac', taxRate: 0 },
    { companyId: company._id, name: 'Huile Végétale 1L', sku: 'ALIM-002', categoryId: categories[2]._id, price: 2500, costPrice: 1800, quantity: 150, minStock: 30, unit: 'bte', taxRate: 0 },
    { companyId: company._id, name: 'Ramette Papier A4', sku: 'FOUR-001', categoryId: categories[3]._id, price: 5500, costPrice: 4000, quantity: 80, minStock: 15, unit: 'ramette', taxRate: 18 },
    { companyId: company._id, name: 'Stylo Billes (boîte 12)', sku: 'FOUR-002', categoryId: categories[3]._id, price: 3500, costPrice: 2200, quantity: 120, minStock: 25, unit: 'boîte', taxRate: 18 },
  ]);

  console.log('Données de démonstration créées avec succès !');
  console.log(`  Email superadmin: ${config.superAdmin.email}`);
  console.log(`  Mot de passe: ${config.superAdmin.password}`);
}

async function main() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`Seeding: ${config.mongoUri} (${config.nodeEnv})`);
    await autoSeed();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
