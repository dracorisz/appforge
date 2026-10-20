import React from 'react'
import { Plus, RefreshCw, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { toast } from '@/lib/toast'
import { Badge, Button, Card, Input, Select, Surface } from '@/components/ui'

type FinDebt = {
  id: string
  creditor: string
  kind: string
  currency: string
  balance_minor: number
  min_payment_minor?: number | null
  due_date?: string | null
  status: string
  consequence_note?: string | null
}

type FinAccount = {
  id: string
  name: string
  kind: string
  currency: string
  opening_balance_minor: number
}

type FinIncome = {
  id: string
  name: string
  kind: string
  currency: string
  expected_minor: number
  cadence: string
  status: string
}

export function Financier({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [debts, setDebts] = React.useState<FinDebt[]>([])
  const [accounts, setAccounts] = React.useState<FinAccount[]>([])
  const [incomes, setIncomes] = React.useState<FinIncome[]>([])

  const [creditor, setCreditor] = React.useState('')
  const [debtBalance, setDebtBalance] = React.useState('')
  const [debtCurrency, setDebtCurrency] = React.useState('EUR')
  const [debtDue, setDebtDue] = React.useState('')
  const [debtConsequence, setDebtConsequence] = React.useState('')

  const [accountName, setAccountName] = React.useState('')
  const [accountBalance, setAccountBalance] = React.useState('')
  const [accountCurrency, setAccountCurrency] = React.useState('EUR')

  const [incomeName, setIncomeName] = React.useState('')
  const [incomeAmount, setIncomeAmount] = React.useState('')
  const [incomeCurrency, setIncomeCurrency] = React.useState('EUR')

  const loadFinanceData = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [debtsRes, accountsRes, incomesRes] = await Promise.all([
        supabase.from('fin_debts').select('*').order('due_date', { ascending: true }),
        supabase.from('fin_accounts').select('*').eq('archived', false).order('created_at', { ascending: false }),
        supabase.from('fin_income_sources').select('*').neq('status', 'ended').order('created_at', { ascending: false }),
      ])
      if (debtsRes.data) setDebts(debtsRes.data as FinDebt[])
      if (accountsRes.data) setAccounts(accountsRes.data as FinAccount[])
      if (incomesRes.data) setIncomes(incomesRes.data as FinIncome[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load financial records.')
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    void loadFinanceData()
  }, [loadFinanceData])

  const addDebt = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!creditor.trim() || !debtBalance.trim() || !user) return
    const minor = Math.round(Number(debtBalance) * 100)
    if (!Number.isFinite(minor) || minor < 0) {
      setError('Enter a valid non-negative balance.')
      return
    }
    setError('')
    const { error: insertErr } = await supabase.from('fin_debts').insert({
      user_id: user.id,
      creditor: creditor.trim(),
      currency: debtCurrency,
      principal_minor: minor,
      balance_minor: minor,
      due_date: debtDue || null,
      consequence_note: debtConsequence.trim() || null,
      status: 'active',
    })
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    toast.success(`Recorded debt: ${creditor.trim()}`)
    setCreditor('')
    setDebtBalance('')
    setDebtDue('')
    setDebtConsequence('')
    await loadFinanceData()
  }

  const addAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accountName.trim() || !user) return
    const minor = Math.round(Number(accountBalance || 0) * 100)
    if (!Number.isFinite(minor)) return
    setError('')
    const { error: insertErr } = await supabase.from('fin_accounts').insert({
      user_id: user.id,
      name: accountName.trim(),
      currency: accountCurrency,
      opening_balance_minor: minor,
      kind: 'bank',
    })
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    toast.success(`Added account: ${accountName.trim()}`)
    setAccountName('')
    setAccountBalance('')
    await loadFinanceData()
  }

  const addIncome = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!incomeName.trim() || !user) return
    const minor = Math.round(Number(incomeAmount || 0) * 100)
    if (!Number.isFinite(minor) || minor < 0) return
    setError('')
    const { error: insertErr } = await supabase.from('fin_income_sources').insert({
      user_id: user.id,
      name: incomeName.trim(),
      currency: incomeCurrency,
      expected_minor: minor,
      kind: 'freelance',
      cadence: 'monthly',
      status: 'pipeline',
    })
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    toast.success(`Added income source: ${incomeName.trim()}`)
    setIncomeName('')
    setIncomeAmount('')
    await loadFinanceData()
  }

  const formatMinor = (minor: number, currency: string) => `${(minor / 100).toFixed(2)} ${currency}`

  return (
    <div className={embedded ? 'space-y-4' : 'mx-auto max-w-6xl space-y-4 p-4'}>
      <Surface variant="muted" padding={2} className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">Verified Financial Ledger</span>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={() => void loadFinanceData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Lamat can populate these records automatically when you share a Google Sheet/Doc or state your figures in chat.
        </p>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </Surface>

      <div className={embedded ? 'grid grid-cols-1 gap-4' : 'grid gap-4 lg:grid-cols-3'}>
        {/* Accounts */}
        <Card className="space-y-4 p-4">
          <h2 className="text-sm font-semibold">Accounts & Cash ({accounts.length})</h2>
          <div className="space-y-2">
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts recorded yet.</p>
            ) : (
              accounts.map((acc) => (
                <Surface key={acc.id} variant="muted" padding={2} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{acc.name}</span>
                  <Badge color="green">{formatMinor(acc.opening_balance_minor, acc.currency)}</Badge>
                </Surface>
              ))
            )}
          </div>
          <form className="space-y-2 border-t border-border/70 pt-4" onSubmit={(e) => void addAccount(e)}>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account or cash name…" />
            <div className="grid grid-cols-[1fr_5.5rem] gap-2">
              <Input
                type="number"
                step="0.01"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                placeholder="Balance (0.00)"
              />
              <Select
                value={accountCurrency}
                onChange={(e) => setAccountCurrency(e.target.value)}
                aria-label="Account currency"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="RSD">RSD</option>
              </Select>
            </div>
            <Button type="submit" variant="secondary" disabled={!accountName.trim()} className="w-full">
              <Plus className="h-4 w-4" /> Add Account
            </Button>
          </form>
        </Card>

        {/* Debts */}
        <Card className="space-y-4 p-4">
          <h2 className="text-sm font-semibold">Active Debts & Arrears ({debts.length})</h2>
          <div className="space-y-2">
            {debts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No debts recorded yet.</p>
            ) : (
              debts.map((debt) => (
                <Surface key={debt.id} variant="muted" padding={2} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{debt.creditor}</span>
                    <Badge color="red">{formatMinor(debt.balance_minor, debt.currency)}</Badge>
                  </div>
                  {debt.due_date && <div className="text-sm text-muted-foreground">Due: {debt.due_date}</div>}
                  {debt.consequence_note && <div className="text-sm text-warning">{debt.consequence_note}</div>}
                </Surface>
              ))
            )}
          </div>
          <form className="space-y-2 border-t border-border/70 pt-4" onSubmit={(e) => void addDebt(e)}>
            <Input value={creditor} onChange={(e) => setCreditor(e.target.value)} placeholder="Creditor / bill name…" />
            <div className="grid grid-cols-[1fr_5.5rem] gap-2">
              <Input
                type="number"
                step="0.01"
                value={debtBalance}
                onChange={(e) => setDebtBalance(e.target.value)}
                placeholder="Amount owed"
              />
              <Select
                value={debtCurrency}
                onChange={(e) => setDebtCurrency(e.target.value)}
                aria-label="Debt currency"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="RSD">RSD</option>
              </Select>
            </div>
            <Input type="date" value={debtDue} onChange={(e) => setDebtDue(e.target.value)} aria-label="Due date" />
            <Input
              value={debtConsequence}
              onChange={(e) => setDebtConsequence(e.target.value)}
              placeholder="Consequence of delay…"
            />
            <Button type="submit" variant="secondary" disabled={!creditor.trim() || !debtBalance.trim()} className="w-full">
              <Plus className="h-4 w-4" /> Record Debt
            </Button>
          </form>
        </Card>

        {/* Income Pipeline */}
        <Card className="space-y-4 p-4">
          <h2 className="text-sm font-semibold">Income Sources & Pipeline ({incomes.length})</h2>
          <div className="space-y-2">
            {incomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income sources recorded yet.</p>
            ) : (
              incomes.map((inc) => (
                <Surface key={inc.id} variant="muted" padding={2} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{inc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {inc.status} · {inc.cadence}
                    </div>
                  </div>
                  <Badge color="blue">{formatMinor(inc.expected_minor, inc.currency)}</Badge>
                </Surface>
              ))
            )}
          </div>
          <form className="space-y-2 border-t border-border/70 pt-4" onSubmit={(e) => void addIncome(e)}>
            <Input value={incomeName} onChange={(e) => setIncomeName(e.target.value)} placeholder="Income source / client…" />
            <div className="grid grid-cols-[1fr_5.5rem] gap-2">
              <Input
                type="number"
                step="0.01"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="Expected monthly"
              />
              <Select
                value={incomeCurrency}
                onChange={(e) => setIncomeCurrency(e.target.value)}
                aria-label="Income currency"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="RSD">RSD</option>
              </Select>
            </div>
            <Button type="submit" variant="secondary" disabled={!incomeName.trim()} className="w-full">
              <Plus className="h-4 w-4" /> Add Income Source
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
