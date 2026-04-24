describe('Admin Login', () => {
  it('should login successfully as admin', () => {
    cy.visit('/admin-login')
    cy.get('input[type="email"]').type('admin@gmail.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/admin/home')
    cy.contains('Administrator Control Center').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.visit('/admin-login')
    cy.get('input[type="email"]').type('invalid@gmail.com')
    cy.get('input[type="password"]').type('wrongpass')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/admin-login') // Should stay on login page
  })

  it('should not allow non-admin users', () => {
    cy.visit('/admin-login')
    cy.get('input[type="email"]').type('ravindu.m@unilink.edu') // student email
    cy.get('input[type="password"]').type('Student@123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/admin-login') // Should stay on login page
  })
})