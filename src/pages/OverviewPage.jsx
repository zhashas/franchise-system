

import { useNavigate } from "react-router-dom"


export default function OverviewPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 bg-blue-900 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to the eFranchise System
        </h1>
        <p className="text-lg md:text-xl text-blue-200 max-w-2xl">
          Simplifying franchise applications for faster, more transparent public service
        </p>
        <p className="text-sm text-blue-300 mt-2">
          Municipality of San Jose, Occidental Mindoro
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-blue-900 hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold transition"
          >
            Register
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-gray-700 text-center mb-6">
          The eFranchise System is a digital platform designed to help tricycle operators, drivers, and transport service providers manage their franchise applications online. It eliminates the need for frequent office visits by allowing users to submit applications, track progress, and receive updates anytime, anywhere.
        </p>

        <p className="text-gray-700 text-center mb-10">
          Built for both the public and the local government unit (LGU), the system improves efficiency, reduces paperwork, and ensures a smoother application process for everyone.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            "🛺 Online Application Submission",
            "📋 Real-Time Status Tracking",
            "🔔 Notifications and Updates",
            "👥 Role-Based Access (Admin, Staff, Applicant)",
          ].map((feature, index) => (
            <div key={index} className="bg-white p-5 rounded-xl shadow flex items-center gap-3">
              <span className="text-gray-800">{feature}</span>
            </div>
          ))}
        </div>

        {/* Why Use */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Why Use This System?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-gray-700">
            <div>
              <h3 className="font-semibold mb-1">Convenience</h3>
              <p className="text-sm">Access services anytime without long queues</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Transparency</h3>
              <p className="text-sm">Track your application with clear updates</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Efficiency</h3>
              <p className="text-sm">Faster processing with less paperwork</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Get started with your franchise application today</p>
          <button
            onClick={() => navigate("/register")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Create an Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6">
        © 2025 Municipality of San Jose, Occidental Mindoro
      </footer>
    </div>
  )
}
