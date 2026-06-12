import Link from "next/link";

const features = [
  { icon: "🛡️", title: "Certified pure", desc: "Lab tested & WHO certified safe for drinking" },
  { icon: "🚚", title: "Fast delivery", desc: "Same-day delivery available in your area" },
  { icon: "🔄", title: "Auto refill", desc: "Set a schedule and never run out again" },
  { icon: "💰", title: "Affordable plans", desc: "Flexible pricing for homes and businesses" },
];

const stats = [
  { number: "15,000+", label: "Happy customers" },
  { number: "99.9%", label: "Purity guaranteed" },
  { number: "24/7", label: "Customer support" },
  { number: "5+", label: "Years of service" },
];

const services = [
  { icon: "🏠", title: "Home delivery", desc: "Fresh purified water delivered on a schedule that works for you. Choose your bottle size and frequency." },
  { icon: "🏢", title: "Office supply", desc: "Bulk water solutions for offices, restaurants, and businesses of all sizes." },
  { icon: "⚙️", title: "Filter installation", desc: "We install and maintain water filtration systems directly at your premises." },
];

export default function Home() {
  return (
    <main className="min-h-screen font-sans">

      {/* Navbar */}
      <nav className="bg-[#042C53] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-[#85B7EB] text-2xl">💧</span>
          <span className="text-white text-lg font-semibold tracking-tight">AquaPure</span>
        </div>
        <div className="hidden md:flex gap-8">
          <a href="#services" className="text-[#B5D4F4] text-sm hover:text-white transition">Services</a>
          <a href="#features" className="text-[#B5D4F4] text-sm hover:text-white transition">Why us</a>
          <a href="#contact" className="text-[#B5D4F4] text-sm hover:text-white transition">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[#B5D4F4] text-sm hover:text-white transition">
            Sign in
          </Link>
          <Link href="/register" className="bg-[#378ADD] text-white px-5 py-2 rounded-full text-sm hover:bg-[#185FA5] transition">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#042C53] px-8 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #378ADD 0%, transparent 50%), radial-gradient(circle at 80% 20%, #85B7EB 0%, transparent 40%)" }}
        />
        <div className="relative max-w-2xl mx-auto">
          <span className="bg-[#0C447C] text-[#85B7EB] text-xs font-medium px-4 py-1.5 rounded-full border border-[#185FA5]">
            ✦ 100% purified · WHO certified
          </span>
          <h1 className="text-5xl font-bold text-white mt-6 mb-4 leading-tight">
            Pure water,<br />
            <span className="text-[#85B7EB]">delivered to you</span>
          </h1>
          <p className="text-[#B5D4F4] text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Fresh, purified water for your home or office. Trusted by thousands of families across the region. No contracts, cancel anytime.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/order"
              className="bg-[#378ADD] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#185FA5] transition">
              Start ordering →
            </Link>
            <a href="#services"
              className="border border-[#378ADD] text-[#85B7EB] px-8 py-3 rounded-full text-sm hover:bg-[#0C447C] transition">
              See our services
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#0C447C]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="py-6 text-center border-r border-[#185FA5] last:border-r-0 border-b md:border-b-0">
              <p className="text-2xl font-bold text-white">{stat.number}</p>
              <p className="text-xs text-[#85B7EB] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-[#E6F1FB] px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-[#378ADD] uppercase tracking-widest font-medium mb-2">
            What we offer
          </p>
          <h2 className="text-center text-2xl font-bold text-[#042C53] mb-10">
            Everything you need for clean water
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#B5D4F4] hover:shadow-md transition">
                <div className="w-12 h-12 bg-[#E6F1FB] rounded-xl flex items-center justify-center text-2xl mb-4">
                  {s.icon}
                </div>
                <h3 className="text-[#042C53] font-semibold mb-2">{s.title}</h3>
                <p className="text-[#185FA5] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-[#378ADD] uppercase tracking-widest font-medium mb-2">
            Why choose us
          </p>
          <h2 className="text-center text-2xl font-bold text-[#042C53] mb-10">
            The AquaPure difference
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((item, i) => (
              <div key={i} className="bg-[#E6F1FB] rounded-2xl p-5 text-center hover:bg-[#B5D4F4] transition">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-sm font-semibold text-[#042C53] mb-1">{item.title}</p>
                <p className="text-xs text-[#185FA5] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-[#E6F1FB] px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-[#378ADD] uppercase tracking-widest font-medium mb-6">
            What our customers say
          </p>
          <div className="bg-white rounded-2xl p-8 border border-[#B5D4F4]">
            <p className="text-[#042C53] text-lg leading-relaxed mb-6">
              "AquaPure has been a game changer for our family. The water tastes amazing and delivery is always on time. I'd never go back to store-bought bottles."
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-[#B5D4F4] rounded-full flex items-center justify-center text-lg">👤</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#042C53]">Sarah M.</p>
                <p className="text-xs text-[#185FA5]">Home customer · Cape Town</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#042C53] px-8 py-16 text-center">
        <div className="max-w-xl mx-auto">
          <span className="text-4xl">💧</span>
          <h2 className="text-white text-2xl font-bold mt-4 mb-3">
            Ready for cleaner water?
          </h2>
          <p className="text-[#85B7EB] text-sm mb-8 leading-relaxed">
            Join over 15,000 customers who trust AquaPure every day. No contracts, no hidden fees.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/order"
              className="bg-[#378ADD] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#185FA5] transition">
              Order now
            </Link>
            <Link href="/login"
              className="border border-[#378ADD] text-[#85B7EB] px-8 py-3 rounded-full text-sm hover:bg-[#0C447C] transition">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#021E38] px-8 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#85B7EB]">💧</span>
            <span className="text-white text-sm font-medium">AquaPure</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[#85B7EB] text-xs hover:text-white transition">Privacy</a>
            <a href="#" className="text-[#85B7EB] text-xs hover:text-white transition">Terms</a>
            <a href="mailto:info@aquapure.com" className="text-[#85B7EB] text-xs hover:text-white transition">info@aquapure.com</a>
          </div>
          <p className="text-[#378ADD] text-xs">© 2026 AquaPure. All rights reserved.</p>
        </div>
      </footer>

    </main>
  );
}