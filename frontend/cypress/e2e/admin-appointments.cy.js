describe('Admin Appointments', () => {
  it('should login as admin and view all appointments', () => {
    // Visit admin login page
    cy.visit('/admin-login')

    // Fill in login form
    cy.get('input[type="email"]').type('admin@gmail.com')
    cy.get('input[type="password"]').type('admin123')

    // Submit login
    cy.get('button[type="submit"]').click()

    // Should redirect to admin home
    cy.url().should('include', '/admin/home')

    // Click on System Appointments
    cy.contains('System Appointments').click()

    // Should be on appointments page
    cy.url().should('include', '/appointments')

    // Check if "All Appointments" is displayed
    cy.contains('All Appointments').should('be.visible')

    // Check if there are appointment cards (assuming there are seeded data)
    cy.get('div').should('contain', '&') // Since names are "Name & Name"
  })
})