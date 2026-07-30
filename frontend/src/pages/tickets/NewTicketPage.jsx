import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Ticket } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomerLayout from '../../layouts/CustomerLayout'
import { ticketService } from '../../services'
import Input, { Textarea } from '../../components/ui/Input'
import CustomSelect from '../../components/ui/CustomSelect'
import Button from '../../components/ui/Button'

export default function NewTicketPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { priority: 'medium' }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { data: ticket } = await ticketService.createTicket(data)
      toast.success('Support ticket created!')
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create ticket.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <button onClick={() => navigate('/tickets')} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to tickets
          </button>
          <h1 className="text-xl font-bold">Create Support Ticket</h1>
          <p className="text-sm text-[var(--text-secondary)]">Describe your issue and our team will help you</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold">New Support Request</h2>
                <p className="text-xs text-[var(--text-secondary)]">Fill in the details below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <Input
                label="Subject *"
                placeholder="Brief description of your issue"
                error={errors.subject?.message}
                {...register('subject', {
                  required: 'Subject is required',
                  minLength: { value: 5, message: 'Min. 5 characters' }
                })}
              />

              <Textarea
                label="Description *"
                placeholder="Please provide as much detail as possible about your issue..."
                rows={6}
                error={errors.description?.message}
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Min. 10 characters' }
                })}
              />

              <CustomSelect
                label="Priority"
                value={watch('priority')}
                onChange={(val) => setValue('priority', val)}
                options={[
                  { value: 'low', label: '🟢 Low Priority' },
                  { value: 'medium', label: '🟡 Medium Priority' },
                  { value: 'high', label: '🟠 High Priority' },
                  { value: 'urgent', label: '🔴 Urgent Priority' },
                ]}
              />

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" variant="primary" loading={loading} className="flex-1">
                  Submit Ticket
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('/tickets')}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </CustomerLayout>
  )
}
