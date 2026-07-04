"""Invoice generation. Produces a self-contained printable HTML invoice saved
under UPLOAD_DIR (served at /uploads) and records an Invoice row. Dependency-free
— the admin 'Print invoice' action prints this HTML to PDF from the browser."""

from __future__ import annotations

import html
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.payment import Invoice
from app.services.image_service import UPLOAD_DIR

BUSINESS = {
    "name": "Kamlesh Paints & Hardware",
    "addr": "FC Road, Dnyaneshwar Paduka Chowk, Shivajinagar, Pune 411005",
    "phone": "+91 98504 20090",
    "email": "kamlesh6678@gmail.com",
}


def _next_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Invoice).count() + 1
    return f"KPH/{year}/{count:05d}"


def generate_invoice(order, db: Session) -> Invoice:
    """Idempotent: returns the existing invoice if the order already has one."""
    existing = db.query(Invoice).filter(Invoice.order_id == order.id).first()
    if existing:
        return existing

    number = _next_number(db)
    rows = "".join(
        f"<tr><td>{html.escape(i.product_name)}"
        f"{(' — ' + html.escape(i.variant_label)) if i.variant_label else ''}</td>"
        f"<td class='r'>{i.quantity}</td><td class='r'>₹{i.unit_price:,}</td>"
        f"<td class='r'>₹{i.unit_price * i.quantity:,}</td></tr>"
        for i in order.items
    )
    gstin = f"<div>GSTIN: {html.escape(settings.GSTIN)}</div>" if settings.GSTIN else ""
    discount_row = (
        f"<tr><td>Discount{(' (' + html.escape(order.coupon_code) + ')') if order.coupon_code else ''}</td>"
        f"<td class='r'>−₹{order.discount:,}</td></tr>" if order.discount else ""
    )
    doc = f"""<!doctype html><html><head><meta charset="utf-8">
<title>Invoice {number}</title><style>
body{{font-family:system-ui,Arial,sans-serif;color:#1a1a0a;max-width:760px;margin:24px auto;padding:0 20px}}
h1{{margin:0;font-size:22px}} .muted{{color:#6b6b5a;font-size:13px}}
table{{width:100%;border-collapse:collapse;margin-top:18px;font-size:14px}}
th,td{{padding:8px 10px;border-bottom:1px solid #eee;text-align:left}}
.r{{text-align:right}} .tot td{{border:none;padding:4px 10px}} .tot .g{{font-weight:700;font-size:16px}}
.head{{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #E8590C;padding-bottom:14px}}
@media print{{body{{margin:0}}}}
</style></head><body>
<div class="head"><div><h1>{BUSINESS['name']}</h1>
<div class="muted">{BUSINESS['addr']}<br>{BUSINESS['phone']} · {BUSINESS['email']}</div>{gstin}</div>
<div class="muted r"><strong>TAX INVOICE</strong><br>{number}<br>
{order.created_at:%d %b %Y}</div></div>
<div style="margin-top:16px"><strong>Bill to:</strong> {html.escape(order.customer_name)}<br>
<span class="muted">{html.escape(order.address)}<br>{html.escape(order.phone)}</span></div>
<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Amount</th></tr></thead>
<tbody>{rows}</tbody></table>
<table class="tot" style="margin-top:8px;max-width:300px;margin-left:auto">
<tr><td>Subtotal</td><td class="r">₹{order.subtotal or 0:,}</td></tr>
{discount_row}
<tr><td>GST ({settings.GST_RATE}%)</td><td class="r">₹{order.gst_amount:,}</td></tr>
<tr><td>Delivery</td><td class="r">{'FREE' if not order.delivery_charge else f'₹{order.delivery_charge:,}'}</td></tr>
<tr class="g"><td>Total</td><td class="r">₹{order.total_amount:,}</td></tr>
</table>
<p class="muted" style="margin-top:24px">Thank you for your order. Delivery within Pune.</p>
</body></html>"""

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"invoice-{number.replace('/', '-')}.html"
    (UPLOAD_DIR / fname).write_text(doc, encoding="utf-8")
    pdf_url = f"{settings.PUBLIC_BASE_URL}/uploads/{fname}"

    invoice = Invoice(
        number=number, order_id=order.id, pdf_url=pdf_url,
        subtotal=order.subtotal or 0, gst_amount=order.gst_amount,
        delivery_charge=order.delivery_charge, discount=order.discount,
        total=order.total_amount,
    )
    db.add(invoice)
    db.flush()
    order.invoice_id = invoice.id
    return invoice
