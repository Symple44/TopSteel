export default function LoginPageUltraSimple() {
  return (
    <div>
      <h1>Login Page</h1>
      <p>Ultra simple login page - no client components, no CSS</p>
      <form>
        <div>
          <label>Email:</label>
          <input type="email" placeholder="admin@topsteel.tech" />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" placeholder="TopSteel44!" />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  )
}