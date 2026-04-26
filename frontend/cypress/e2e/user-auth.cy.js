describe('User Login and Registration', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/chat/rooms/user/*', { statusCode: 200, body: [] })
  })

  it('should login a student successfully', () => {
    const studentUser = {
      id: 6001,
      name: 'Cypress Student',
      role: 'STUDENT',
      email: 'student.cypress@unilink.edu',
      department: 'Faculty Of Computing',
    }

    cy.intercept('POST', '**/api/auth/login', { statusCode: 200, body: studentUser }).as('loginUser')
    cy.intercept('GET', '**/api/appointments/student/*', { statusCode: 200, body: [] })

    cy.visit('/')
    cy.get('input[placeholder="University email"]').type('student.cypress@unilink.edu')
    cy.get('input[placeholder="Password"]').type('Student@123')
    cy.contains('button', 'Sign In').click()

    cy.wait('@loginUser')
    cy.url({ timeout: 15000 }).should('include', '/student/home')
    cy.contains('My Chats').should('be.visible')
  })

  it('should validate required fields on login', () => {
    cy.visit('/')
    cy.contains('button', 'Sign In').click()

    cy.contains('Email is required').should('be.visible')
  })

  it('should register a new student successfully', () => {
    const registeredUser = {
      id: 6002,
      name: 'New Cypress Student',
      role: 'STUDENT',
      email: 'new.cypress.student@unilink.edu',
      department: 'Faculty Of Computing',
    }

    cy.intercept('POST', '**/api/auth/register', { statusCode: 200, body: registeredUser }).as('registerUser')
    cy.intercept('GET', '**/api/appointments/student/*', { statusCode: 200, body: [] })

    cy.visit('/')
    cy.contains('button', 'Register').click()

    cy.get('input[placeholder="Full name"]').type('New Cypress Student')
    cy.get('input[placeholder="Email"]').type('new.cypress.student@unilink.edu')
    cy.get('input[placeholder="Password (min 8 chars)"]').type('Student@123')
    cy.get('input[placeholder="Confirm password"]').type('Student@123')

    cy.get('select').contains('option', 'Select department').parent().select('Faculty Of Computing')
    cy.get('input[placeholder="Phone"]').type('0771234567')
    cy.get('input[placeholder="Registration number"]').type('IT12345678')
    cy.get('select').contains('option', 'Select batch / program').parent().select('Computer Science')
    cy.get('select').contains('option', 'Select academic year and semester').parent().select('Year 2 Semester 1')

    cy.contains('button', 'Create Account').click()

    cy.wait('@registerUser').its('request.body').should((body) => {
      expect(body.role).to.eq('STUDENT')
      expect(body.registrationNumber).to.eq('IT12345678')
    })

    cy.url({ timeout: 15000 }).should('include', '/student/home')
    cy.contains('My Chats').should('be.visible')
  })
})
