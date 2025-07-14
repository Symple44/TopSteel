/**
 * 🎨 DÉMO DESIGN SYSTEM - Exemples d'utilisation
 * Démonstration des composants avec variantes class-variance-authority
 */

import * as React from 'react'
import { Button } from '../components/primitives/button/Button'
import { Badge } from '../components/data-display/badge/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/layout/card/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/data-display/table/table'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarNav, 
  SidebarNavItem,
  SidebarSection,
  SidebarSectionTitle 
} from '../components/layout/sidebar/Sidebar'

export function DesignSystemDemo() {
  return (
    <div className="p-8 space-y-8">
      {/* Card Variants Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Card Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Standard border and shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content goes here...</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Enhanced shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content goes here...</p>
            </CardContent>
          </Card>

          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Ghost Card</CardTitle>
              <CardDescription>No border or shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content goes here...</p>
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardHeader>
              <CardTitle>Outline Card</CardTitle>
              <CardDescription>Border only</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content goes here...</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Button Variants Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🎯</Button>
        </div>
      </section>

      {/* Badge Variants Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Badge Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Table Variants Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Table Variants</h2>
        
        <h3 className="text-lg font-semibold mb-2">Default Table</h3>
        <Table variant="default">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Project A</TableCell>
              <TableCell><Badge variant="default">Active</Badge></TableCell>
              <TableCell>€1,500</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Project B</TableCell>
              <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
              <TableCell>€2,300</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <h3 className="text-lg font-semibold mb-2 mt-6">Striped Table</h3>
        <Table variant="striped" size="sm">
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>ACME Corp</TableCell>
              <TableCell>Website Redesign</TableCell>
              <TableCell><Badge variant="destructive">High</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>TechStart</TableCell>
              <TableCell>Mobile App</TableCell>
              <TableCell><Badge variant="outline">Medium</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>GlobalCorp</TableCell>
              <TableCell>ERP Integration</TableCell>
              <TableCell><Badge variant="default">Low</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Sidebar Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Sidebar Variants</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-96">
          {/* Default Sidebar */}
          <div className="border rounded-lg overflow-hidden">
            <Sidebar variant="default" size="default" className="h-full">
              <SidebarHeader>
                <h3 className="font-semibold">Default Sidebar</h3>
              </SidebarHeader>
              <SidebarContent>
                <SidebarNav>
                  <SidebarSection>
                    <SidebarSectionTitle>Navigation</SidebarSectionTitle>
                    <SidebarNavItem isActive>Dashboard</SidebarNavItem>
                    <SidebarNavItem>Projects</SidebarNavItem>
                    <SidebarNavItem>Clients</SidebarNavItem>
                  </SidebarSection>
                </SidebarNav>
              </SidebarContent>
              <SidebarFooter>
                <p className="text-xs text-muted-foreground">Footer content</p>
              </SidebarFooter>
            </Sidebar>
          </div>

          {/* Floating Sidebar */}
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            <Sidebar variant="floating" size="sm">
              <SidebarHeader>
                <h3 className="font-semibold">Floating</h3>
              </SidebarHeader>
              <SidebarContent>
                <SidebarNav>
                  <SidebarNavItem isActive>Home</SidebarNavItem>
                  <SidebarNavItem>Settings</SidebarNavItem>
                  <SidebarNavItem>Help</SidebarNavItem>
                </SidebarNav>
              </SidebarContent>
            </Sidebar>
          </div>

          {/* Inset Sidebar */}
          <div className="border rounded-lg overflow-hidden">
            <Sidebar variant="inset" size="lg">
              <SidebarHeader>
                <h3 className="font-semibold">Inset Sidebar</h3>
              </SidebarHeader>
              <SidebarContent>
                <SidebarNav>
                  <SidebarSection>
                    <SidebarSectionTitle>Main</SidebarSectionTitle>
                    <SidebarNavItem>Overview</SidebarNavItem>
                    <SidebarNavItem isActive>Analytics</SidebarNavItem>
                  </SidebarSection>
                  <SidebarSection>
                    <SidebarSectionTitle>Tools</SidebarSectionTitle>
                    <SidebarNavItem>Reports</SidebarNavItem>
                    <SidebarNavItem>Export</SidebarNavItem>
                  </SidebarSection>
                </SidebarNav>
              </SidebarContent>
            </Sidebar>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DesignSystemDemo