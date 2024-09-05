'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from '@/lib/utils'
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, ExternalLink } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const CoinDisplay = ({ amount }: { amount: number }) => {
  const gold = Math.floor(amount / 10000)
  const silver = Math.floor((amount % 10000) / 100)
  const copper = amount % 100

  return (
    <div className="flex items-center justify-end space-x-1">
      {gold > 0 && (
        <span className="flex items-center">
          {gold}
          <img src="/images/gold-coin.png" alt="Gold" className="w-4 h-4 ml-1" />
        </span>
      )}
      <span className="flex items-center">
        {silver}
        <img src="/images/silver-coin.png" alt="Silver" className="w-4 h-4 ml-1" />
      </span>
      <span className="flex items-center">
        {copper}
        <img src="/images/copper-coin.png" alt="Copper" className="w-4 h-4 ml-1" />
      </span>
    </div>
  )
}

interface Listing {
  listings: number;
  unit_price: number;
  quantity: number;
}

interface ListingsData {
  buys: Listing[];
  sells: Listing[];
}

const ItemDetails = () => {
  const params = useParams()
  const id = params?.id as string  // Type assertion
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleBack = () => {
    const queryString = searchParams ? searchParams.toString() : ''
    router.push(queryString ? `/?${queryString}` : '/')
  }

  const fetchItemDetails = async () => {
    if (!id) throw new Error('No item ID provided')
    const response = await fetch(`/api/items/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json()
  }

  const { data: item, error, isLoading } = useQuery({
    queryKey: ['itemDetails', id],
    queryFn: fetchItemDetails,
    enabled: !!id  // Only run the query if we have an id
  })

  const { data: listingsData, isLoading: listingsLoading } = useQuery<ListingsData>({
    queryKey: ['listings', id],
    queryFn: async () => {
      const response = await fetch(`https://api.guildwars2.com/v2/commerce/listings/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>
  if (!item) return <div>No data available</div>

  const profit = item.sell_price - item.buy_price
  const roi = item.buy_price > 0 ? ((profit / item.buy_price) * 100).toFixed(2) : 'N/A'

  const renderListings = (listings: Listing[], type: 'buy' | 'sell') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Traders</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map((listing, index) => {
          const total = listing.unit_price * listing.quantity;
          const traders = index + 1;
          const avgPrice = Math.floor(total / listing.quantity);
          
          return (
            <TableRow key={index} className="hover:bg-muted/50" title={`Traders: ${traders} | Qty: ${listing.quantity} | Avg: ${formatPrice(avgPrice)} | Total: ${formatPrice(total)}`}>
              <TableCell className="text-right">{listing.quantity.toLocaleString()}</TableCell>
              <TableCell>
                {type === 'buy' ? 'Ordered' : 'Available'}<br />
                {listing.listings} {type === 'buy' ? 'Buyer' : 'Seller'}{listing.listings > 1 ? 's' : ''}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <CoinDisplay amount={listing.unit_price} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <img src={item.img} alt={item.name} className="w-16 h-16" />
            <div>
              <CardTitle>{item.name}</CardTitle>
              <Badge>{item.rarity}</Badge>
              <Badge>{item.type}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Buy Order</h3>
              <p>Price: <CoinDisplay amount={item.buy_price} /></p>
              <p>Quantity: {item.buy_quantity.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sell Listing</h3>
              <p>Price: <CoinDisplay amount={item.sell_price} /></p>
              <p>Quantity: {item.sell_quantity.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">24 Hour Trading Volume</h3>
            <p>Buy orders filled: {item['1d_buy_sold'].toLocaleString()}</p>
            <p>Sell listings filled: {item['1d_sell_sold'].toLocaleString()}</p>
          </div>
          <div className="mt-4 flex space-x-2">
            <Button onClick={() => navigator.clipboard.writeText(item.chat_link)}>
              <Copy className="mr-2 h-4 w-4" /> Copy Chat Link
            </Button>
            <Button asChild>
              <a href={`https://www.gw2bltc.com/en/item/${item.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> View on GW2BLTC
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <img src={item.img} alt={item.name} className="w-12 h-12 mr-4" />
              {item.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Chat Link:</td>
                  <td className="py-2 flex items-center">
                    <code className="bg-gray-100 p-1 rounded">{item.chat_link}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => navigator.clipboard.writeText(item.chat_link)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Trading Post Info</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Sell:</td>
                  <td className="py-2 text-right">
                    <CoinDisplay amount={item.sell_price} />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Buy:</td>
                  <td className="py-2 text-right">
                    <CoinDisplay amount={item.buy_price} />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Profit:</td>
                  <td className="py-2 text-right"><CoinDisplay amount={profit} /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">ROI:</td>
                  <td className="py-2 text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{roi}%</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Supply:</td>
                  <td className="py-2 text-right">{item.sell_quantity}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">Demand:</td>
                  <td className="py-2 text-right">{item.buy_quantity}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">1d Sell Sold:</td>
                  <td className="py-2 text-right">{item['1d_sell_sold']}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">1d Buy Sold:</td>
                  <td className="py-2 text-right">{item['1d_buy_sold']}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[697px] overflow-auto">
              {listingsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                renderListings(listingsData?.buys || [], 'buy')
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[697px] overflow-auto">
              {listingsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                renderListings(listingsData?.sells || [], 'sell')
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ItemDetails