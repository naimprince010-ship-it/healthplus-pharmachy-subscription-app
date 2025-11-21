
SELECT 
  o.id,
  o."orderNumber",
  o."userId",
  o.total,
  o."createdAt"
FROM "Order" o
LEFT JOIN "User" u ON o."userId" = u.id
WHERE u.id IS NULL;

SELECT 
  oi.id,
  oi."orderId",
  oi."medicineId",
  oi.quantity,
  oi.total
FROM "OrderItem" oi
LEFT JOIN "Order" o ON oi."orderId" = o.id
WHERE o.id IS NULL;

SELECT 
  oi.id,
  oi."orderId",
  oi."medicineId",
  oi.quantity,
  oi.total
FROM "OrderItem" oi
LEFT JOIN "Medicine" m ON oi."medicineId" = m.id
WHERE m.id IS NULL;

SELECT 
  p.id,
  p."userId",
  p.name,
  p.phone,
  p."fileUrl",
  p.status,
  p."createdAt"
FROM "Prescription" p
LEFT JOIN "User" u ON p."userId" = u.id
WHERE u.id IS NULL;

SELECT 
  s.id,
  s."userId",
  s."planId",
  s."isActive",
  s."nextDeliveryDate"
FROM "Subscription" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL;

SELECT 
  s.id,
  s."userId",
  s."planId",
  s."isActive",
  s."nextDeliveryDate"
FROM "Subscription" s
LEFT JOIN "SubscriptionPlan" sp ON s."planId" = sp.id
WHERE sp.id IS NULL;

SELECT 
  um.id,
  um."userId",
  um."planId",
  um."isActive",
  um."startDate",
  um."endDate"
FROM "UserMembership" um
LEFT JOIN "User" u ON um."userId" = u.id
WHERE u.id IS NULL;

SELECT 
  um.id,
  um."userId",
  um."planId",
  um."isActive",
  um."startDate",
  um."endDate"
FROM "UserMembership" um
LEFT JOIN "MembershipPlan" mp ON um."planId" = mp.id
WHERE mp.id IS NULL;

SELECT 
  a.id,
  a."userId",
  a."fullName",
  a.phone,
  a."addressLine1",
  a.city
FROM "Address" a
LEFT JOIN "User" u ON a."userId" = u.id
WHERE u.id IS NULL;

SELECT 
  a.id,
  a."userId",
  a."zoneId",
  a."fullName",
  a.city
FROM "Address" a
LEFT JOIN "Zone" z ON a."zoneId" = z.id
WHERE z.id IS NULL;

SELECT 
  m.id,
  m.name,
  m."categoryId",
  m.price,
  m."isActive"
FROM "Medicine" m
LEFT JOIN "Category" c ON m."categoryId" = c.id
WHERE c.id IS NULL;

SELECT 
  si.id,
  si."planId",
  si."medicineId",
  si.quantity
FROM "SubscriptionItem" si
LEFT JOIN "SubscriptionPlan" sp ON si."planId" = sp.id
WHERE sp.id IS NULL;

SELECT 
  si.id,
  si."planId",
  si."medicineId",
  si.quantity
FROM "SubscriptionItem" si
LEFT JOIN "Medicine" m ON si."medicineId" = m.id
WHERE m.id IS NULL;

SELECT 
  'Orders without User' as check_name,
  COUNT(*) as orphan_count
FROM "Order" o
LEFT JOIN "User" u ON o."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'OrderItems without Order',
  COUNT(*)
FROM "OrderItem" oi
LEFT JOIN "Order" o ON oi."orderId" = o.id
WHERE o.id IS NULL

UNION ALL

SELECT 
  'Prescriptions without User',
  COUNT(*)
FROM "Prescription" p
LEFT JOIN "User" u ON p."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Subscriptions without User',
  COUNT(*)
FROM "Subscription" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Addresses without User',
  COUNT(*)
FROM "Address" a
LEFT JOIN "User" u ON a."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Medicines without Category',
  COUNT(*)
FROM "Medicine" m
LEFT JOIN "Category" c ON m."categoryId" = c.id
WHERE c.id IS NULL;
