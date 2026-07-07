# Product

- Product: CakeLovely sales dashboard
- Purpose: track monthly sales by city, category, and month; store history; calculate weighted sold units and revenue
- Primary users: owner/operator who enters sales manually and reviews monthly performance
- Core entities: city, month, category, sale entry, monthly history record
- Main workflow: choose city and month, enter sale data, review sold units, revenue, chart, and month records
- Settings workflow: adjust category prices and historical month data per city
- Calculation rule: Bento Standart is the base unit for weighted sold quantity; revenue is always based on the manually entered price for that period

## Product principles

- Data first: metrics and forms must be easy to scan and edit quickly
- Familiar controls: use simple tabs, dropdowns, inputs, and buttons
- Stable scope: sales entered in one city must not affect the other city
- Historical accuracy: past month values should remain preserved once saved
- Lightweight motion: use subtle appearance animation only, without distracting transitions

## Visual direction

- Soft pink, white, and a small set of accent colors
- Rounded, airy cards with strong contrast for key numbers
- Layout should stay close to the provided prototype

## Non-goals

- Marketing landing page
- Decorative content that reduces readability
- Automatic pricing logic that overrides manual input