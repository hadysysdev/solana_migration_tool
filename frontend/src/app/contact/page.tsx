"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    project: "",
    tokenSupply: "",
    description: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tokenSupply: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white relative py-24 px-4">
      {/* Background effects - matches your main page style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent mb-6">
            Get Started With w3Swap
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
            Share your project details and our team will reach out within 24 hours.
          </p>
        </motion.div>

        {/* Form */}
        {!submitted ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="glass-card p-8 space-y-6"
          >
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                placeholder="you@project.com"
              />
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Project Name</label>
              <Input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleChange}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                placeholder="Your project name"
              />
            </div>

            {/* Token Supply */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Current Token Supply</label>
              <Select value={formData.tokenSupply} onValueChange={handleSelectChange} required>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500">
                  <SelectValue placeholder="Select supply range" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="1m-10m">1M - 10M</SelectItem>
                  <SelectItem value="10m-100m">10M - 100M</SelectItem>
                  <SelectItem value="100m-1b">100M - 1B</SelectItem>
                  <SelectItem value="1b+">1B+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Migration Details</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 resize-none"
                placeholder="Describe your migration needs, target chain, timeline, etc."
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-brand flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-400">
              We respect your privacy. Your information will only be used to contact you about your migration.
            </p>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">Application Received!</h2>
            <p className="text-slate-400 mb-6">
              Thank you for reaching out. Our team will review your migration requirements and contact you within 24
              hours at <span className="font-semibold text-white">{formData.email}</span>.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false)
                setFormData({
                  name: "",
                  email: "",
                  project: "",
                  tokenSupply: "",
                  description: "",
                })
              }}
              className="btn-brand"
            >
              Submit Another Application
            </Button>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-2 gap-6"
        >
          <Card className="glass-card p-6">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-2 text-white">Quick Response</h3>
              <p className="text-sm text-slate-400">Our team typically responds within 24 business hours.</p>
            </CardContent>
          </Card>
          <Card className="glass-card p-6">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-2 text-white">No Commitment</h3>
              <p className="text-sm text-slate-400">
                Initial consultation is completely free with no obligations.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

