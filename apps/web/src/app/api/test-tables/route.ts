import { NextResponse } from 'next/server'

export async function GET() {
  const testData = [
    { name: 'test_table_1', schema: 'test', columns: [{ name: 'id', type: 'int' }] },
    { name: 'test_table_2', schema: 'test', columns: [{ name: 'name', type: 'varchar' }] },
  ]
  return NextResponse?.json(testData)
}
