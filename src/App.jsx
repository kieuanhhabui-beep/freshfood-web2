import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [todayOrders, setTodayOrders] = useState([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      loadTodayOrders()
    }
  }, [session])

  async function loadTodayOrders() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    const orders = data || []
    setTodayOrders(orders)

    const revenue = orders
      .filter(order => order.order_status !== 'CANCELLED')
      .reduce((sum, order) => sum + Number(order.total || 0), 0)

    setTodayRevenue(revenue)
  }

  async function handleLogin(e) {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Đang tải...</p>
  }

  if (!session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7f4',
          padding: 20,
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: 400,
            background: '#fff',
            padding: 30,
            borderRadius: 14,
          }}
        >
          <h1>FreshFood Admin</h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: 12,
              background: '#2f855a',
              color: '#fff',
              border: 0,
              borderRadius: 8,
            }}
          >
            Đăng nhập
          </button>

          <p>{message}</p>
        </form>
      </div>
    )
  }

  if (page === 'new-order') {
    return (
      <NewOrder
        onBack={() => setPage('dashboard')}
        onCreated={() => {
          setPage('dashboard')
          loadTodayOrders()
        }}
      />
    )
  }

  const delivering = todayOrders.filter(
    order => order.order_status === 'DELIVERING'
  ).length

  const unpaid = todayOrders.filter(
    order => order.payment_status !== 'PAID'
  ).length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7f4',
        padding: 30,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 30,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 48 }}>
              FreshFood
            </h1>

            <p style={{ marginTop: 6, color: '#666' }}>
              Quản lý bán hàng
            </p>
          </div>

          <button onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          <DashboardCard
            title="Đơn hôm nay"
            value={`${todayOrders.length} đơn`}
          />

          <DashboardCard
            title="Doanh thu hôm nay"
            value={`${todayRevenue.toLocaleString('vi-VN')}đ`}
          />

          <DashboardCard
            title="Đang giao"
            value={`${delivering} đơn`}
          />

          <DashboardCard
            title="Chưa thanh toán"
            value={`${unpaid} đơn`}
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={() => setPage('new-order')}
            style={{
              padding: '16px 28px',
              background: '#2f855a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            + Tạo đơn mới
          </button>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2>Đơn hàng hôm nay</h2>

          {todayOrders.length === 0 ? (
            <p>Chưa có đơn hàng hôm nay.</p>
          ) : (
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {todayOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr',
                    gap: 15,
                    padding: 16,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <strong>{order.order_code}</strong>

                  <div>
                    <strong>{order.customer_name}</strong>
                    <div style={{ color: '#777' }}>
                      {order.customer_phone}
                    </div>
                  </div>

                  <div>
                    {Number(order.total || 0).toLocaleString('vi-VN')}đ
                  </div>

                  <div>
                    {order.payment_status === 'PAID'
                      ? 'Đã thanh toán'
                      : 'Chưa thanh toán'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewOrder({ onBack, onCreated }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [shippingFee, setShippingFee] = useState(0)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')

  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [items, setItems] = useState([])

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error(error)
      return
    }

    setProducts(data || [])
  }

  function addItem() {
    const product = products.find(
      p => String(p.id) === String(selectedProductId)
    )

    if (!product) {
      alert('Hãy chọn sản phẩm')
      return
    }

    const qty = Number(quantity)

    if (!qty || qty <= 0) {
      alert('Số lượng phải lớn hơn 0')
      return
    }

    const itemTotal = qty * Number(product.price)

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: qty,
        unit_price: Number(product.price),
        total: itemTotal,
      },
    ])

    setSelectedProductId('')
    setQuantity(1)
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.total),
    0
  )

  const total = subtotal + Number(shippingFee || 0)

  async function saveOrder(e) {
    e.preventDefault()

    if (items.length === 0) {
      setMessage('Đơn hàng chưa có sản phẩm')
      return
    }

    const orderCode = 'DH' + Date.now()

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_code: orderCode,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          source: 'Zalo',
          shipping_fee: Number(shippingFee || 0),
          subtotal,
          total,
          payment_status: 'UNPAID',
          order_status: 'NEW',
          note,
        },
      ])
      .select()
      .single()

    if (orderError) {
      setMessage('Lỗi tạo đơn: ' + orderError.message)
      return
    }

    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total: item.total,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      setMessage(
        'Đã tạo đơn nhưng lỗi lưu sản phẩm: ' +
        itemsError.message
      )
      return
    }

    setMessage('Tạo đơn thành công')

    setTimeout(() => {
      onCreated()
    }, 700)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7f4',
        padding: 30,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: '#fff',
          padding: 30,
          borderRadius: 14,
        }}
      >
        <button
          onClick={onBack}
          style={{
            marginBottom: 20,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
          }}
        >
          ← Quay lại
        </button>

        <h1>Tạo đơn mới</h1>

        <form onSubmit={saveOrder}>
          <label>Tên khách hàng</label>

          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          <label>Số điện thoại</label>

          <input
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          <label>Địa chỉ</label>

          <input
            value={customerAddress}
            onChange={e => setCustomerAddress(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 20,
              boxSizing: 'border-box',
            }}
          />

          <h2>Sản phẩm</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr auto',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
            >
              <option value="">Chọn sản phẩm</option>

              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} -{' '}
                  {Number(product.price).toLocaleString('vi-VN')}đ/{product.unit}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.001"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />

            <button type="button" onClick={addItem}>
              + Thêm
            </button>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: 12,
                padding: 10,
                borderBottom: '1px solid #ddd',
              }}
            >
              <strong>{item.product_name}</strong>

              <div>
                {item.quantity} {item.unit}
              </div>

              <div>
                {item.total.toLocaleString('vi-VN')}đ
              </div>

              <button
                type="button"
                onClick={() => removeItem(index)}
              >
                Xóa
              </button>
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <label>Phí ship</label>

            <input
              type="number"
              value={shippingFee}
              onChange={e => setShippingFee(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              background: '#f5f5f5',
              padding: 18,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <p>
              Tạm tính: {subtotal.toLocaleString('vi-VN')}đ
            </p>

            <h2>
              Tổng: {total.toLocaleString('vi-VN')}đ
            </h2>
          </div>

          <label>Ghi chú</label>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 20,
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: 14,
              background: '#2f855a',
              color: '#fff',
              border: 0,
              borderRadius: 8,
            }}
          >
            Lưu đơn
          </button>

          <p>{message}</p>
        </form>
      </div>
    </div>
  )
}

function DashboardCard({ title, value }) {
  return (
    <div
      style={{
        background: '#fff',
        padding: 24,
        borderRadius: 14,
        boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
        textAlign: 'center',
      }}
    >
      <p style={{ color: '#777' }}>
        {title}
      </p>

      <h2>{value}</h2>
    </div>
  )
}

export default App