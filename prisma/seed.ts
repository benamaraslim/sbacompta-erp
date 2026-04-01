import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Departments
  const depts = await Promise.all([
    prisma.department.upsert({ where: { name: 'Direction' }, update: {}, create: { name: 'Direction', description: 'Direction générale' } }),
    prisma.department.upsert({ where: { name: 'Comptabilité' }, update: {}, create: { name: 'Comptabilité', description: 'Finance et comptabilité' } }),
    prisma.department.upsert({ where: { name: 'Commercial' }, update: {}, create: { name: 'Commercial', description: 'Ventes et relation client' } }),
    prisma.department.upsert({ where: { name: 'Informatique' }, update: {}, create: { name: 'Informatique', description: 'DSI et développement' } }),
    prisma.department.upsert({ where: { name: 'Logistique' }, update: {}, create: { name: 'Logistique', description: 'Stock et livraisons' } }),
  ])

  // Employees
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { email: 'marie.dupont@entreprise.fr' },
      update: {},
      create: {
        employeeId: 'EMP-0001', firstName: 'Marie', lastName: 'Dupont',
        email: 'marie.dupont@entreprise.fr', position: 'Directrice Générale',
        departmentId: depts[0].id, salary: 5500, hireDate: new Date('2018-01-15'),
      },
    }),
    prisma.employee.upsert({
      where: { email: 'paul.martin@entreprise.fr' },
      update: {},
      create: {
        employeeId: 'EMP-0002', firstName: 'Paul', lastName: 'Martin',
        email: 'paul.martin@entreprise.fr', position: 'Comptable',
        departmentId: depts[1].id, salary: 3200, hireDate: new Date('2020-03-01'),
      },
    }),
    prisma.employee.upsert({
      where: { email: 'sophie.bernard@entreprise.fr' },
      update: {},
      create: {
        employeeId: 'EMP-0003', firstName: 'Sophie', lastName: 'Bernard',
        email: 'sophie.bernard@entreprise.fr', position: 'Responsable Commercial',
        departmentId: depts[2].id, salary: 4200, hireDate: new Date('2019-06-15'),
      },
    }),
    prisma.employee.upsert({
      where: { email: 'julien.leroy@entreprise.fr' },
      update: {},
      create: {
        employeeId: 'EMP-0004', firstName: 'Julien', lastName: 'Leroy',
        email: 'julien.leroy@entreprise.fr', position: 'Développeur Full-Stack',
        departmentId: depts[3].id, salary: 4800, hireDate: new Date('2021-09-01'),
      },
    }),
  ])

  // Product categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { name: 'Matériel informatique' }, update: {}, create: { name: 'Matériel informatique' } }),
    prisma.category.upsert({ where: { name: 'Mobilier de bureau' }, update: {}, create: { name: 'Mobilier de bureau' } }),
    prisma.category.upsert({ where: { name: 'Fournitures' }, update: {}, create: { name: 'Fournitures' } }),
    prisma.category.upsert({ where: { name: 'Logiciels' }, update: {}, create: { name: 'Logiciels' } }),
  ])

  // Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { code: 'LAPTOP-PRO' },
      update: {},
      create: { code: 'LAPTOP-PRO', name: 'Laptop Pro 15"', categoryId: cats[0].id, costPrice: 800, salePrice: 1299, stock: 15, minStock: 3, unit: 'pcs' },
    }),
    prisma.product.upsert({
      where: { code: 'MOUSE-WIRELESS' },
      update: {},
      create: { code: 'MOUSE-WIRELESS', name: 'Souris sans fil', categoryId: cats[0].id, costPrice: 15, salePrice: 35, stock: 2, minStock: 5, unit: 'pcs' },
    }),
    prisma.product.upsert({
      where: { code: 'DESK-ADJ' },
      update: {},
      create: { code: 'DESK-ADJ', name: 'Bureau ajustable', categoryId: cats[1].id, costPrice: 200, salePrice: 450, stock: 8, minStock: 2, unit: 'pcs' },
    }),
    prisma.product.upsert({
      where: { code: 'PAPER-A4' },
      update: {},
      create: { code: 'PAPER-A4', name: 'Ramette papier A4', categoryId: cats[2].id, costPrice: 3, salePrice: 6.5, stock: 1, minStock: 10, unit: 'ramette' },
    }),
    prisma.product.upsert({
      where: { code: 'MONITOR-4K' },
      update: {},
      create: { code: 'MONITOR-4K', name: 'Écran 4K 27"', categoryId: cats[0].id, costPrice: 350, salePrice: 599, stock: 6, minStock: 2, unit: 'pcs' },
    }),
  ])

  // Customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: { id: 'customer-1', name: 'Acme Corp', email: 'contact@acme.fr', phone: '01 23 45 67 89', company: 'Acme Corporation', taxNumber: 'FR12345678901' },
    }).catch(() => prisma.customer.findFirst({ where: { name: 'Acme Corp' } })),
    prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: { id: 'customer-2', name: 'Tech Solutions', email: 'info@techsolutions.fr', company: 'Tech Solutions SAS' },
    }).catch(() => prisma.customer.findFirst({ where: { name: 'Tech Solutions' } })),
    prisma.customer.upsert({
      where: { id: 'customer-3' },
      update: {},
      create: { id: 'customer-3', name: 'Boutique Durand', email: 'durand@boutique.fr', phone: '04 56 78 90 12' },
    }).catch(() => prisma.customer.findFirst({ where: { name: 'Boutique Durand' } })),
  ])

  console.log('✅ Seed completed!')
  console.log(`  - ${depts.length} départements`)
  console.log(`  - ${employees.length} employés`)
  console.log(`  - ${cats.length} catégories`)
  console.log(`  - ${products.length} produits`)
  console.log(`  - ${customers.length} clients`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
