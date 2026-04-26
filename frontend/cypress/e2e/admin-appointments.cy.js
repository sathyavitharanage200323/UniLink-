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

  it('should display admin home page features', () => {
    // Visit admin login page
    cy.visit('/admin-login')

    // Fill in login form
    cy.get('input[type="email"]').type('admin@gmail.com')
    cy.get('input[type="password"]').type('admin123')

    // Submit login
    cy.get('button[type="submit"]').click()

    // Should redirect to admin home
    cy.url().should('include', '/admin/home')

    // Check main title
    cy.contains('Administrator Control Center').should('be.visible')

    // Check all feature cards are visible
    cy.contains('Management Console').should('be.visible')
    cy.contains('Edit or delete student and lecturer accounts.').should('be.visible')

    cy.contains('System Appointments').should('be.visible')
    cy.contains('View all appointments across the platform.').should('be.visible')

    cy.contains('Chat Oversight').should('be.visible')
    cy.contains('Open messaging workspace and monitor conversations.').should('be.visible')

    cy.contains('Bug Reports').should('be.visible')
    cy.contains('Review user-reported bugs and publish fixes.').should('be.visible')

    cy.contains('Admin Profile').should('be.visible')
    cy.contains('Update admin profile details and preferences.').should('be.visible')
  })
})