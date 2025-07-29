import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[Test Tables API] Simple test route called')
  
  const testData = [
    { name: 'test_table_1', schema: 'test', columns: [{name: 'id', type: 'int'}] },
    { name: 'test_table_2', schema: 'test', columns: [{name: 'name', type: 'varchar'}] }
  ]
  
  console.log('[Test Tables API] Returning test data:', testData)
  return NextResponse.json(testData)
}