/**
 * CompanySettingsPage - 회사 정보 설정 페이지
 */

import { useState, useEffect } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { SupabaseCompanyRepository } from '@infrastructure/repositories'
import { Company } from '@domain/entities/Company'
import { Save, Building2 } from 'lucide-react'

const companyRepository = new SupabaseCompanyRepository()

export function CompanySettingsPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    companyNameKr: '',
    companyNameEn: '',
    ceoName: '',
    businessNumber: '',
    addressKr: '',
    addressEn: '',
    phone: '',
    fax: '',
  })

  useEffect(() => {
    loadCompany()
  }, [])

  const loadCompany = async () => {
    try {
      const data = await companyRepository.findActive()
      if (data) {
        setCompany(data)
        setFormData({
          companyNameKr: data.companyNameKr,
          companyNameEn: data.companyNameEn ?? '',
          ceoName: data.ceoName,
          businessNumber: data.businessNumber,
          addressKr: data.addressKr,
          addressEn: data.addressEn ?? '',
          phone: data.phone ?? '',
          fax: data.fax ?? '',
        })
      }
    } catch (error) {
      console.error('회사 정보 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedCompany = Company.create({
        id: company?.id ?? crypto.randomUUID(),
        companyNameKr: formData.companyNameKr,
        companyNameEn: formData.companyNameEn || undefined,
        ceoName: formData.ceoName,
        businessNumber: formData.businessNumber,
        addressKr: formData.addressKr,
        addressEn: formData.addressEn || undefined,
        phone: formData.phone || undefined,
        fax: formData.fax || undefined,
        isActive: true,
      })

      await companyRepository.save(updatedCompany)
      setCompany(updatedCompany)
      alert('회사 정보가 저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="회사 정보 설정"
        description="발주서에 표시될 회사 정보를 관리합니다."
        actions={
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '저장 중...' : '저장'}
          </Button>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyNameKr">회사명 (한글) *</Label>
                  <Input
                    id="companyNameKr"
                    value={formData.companyNameKr}
                    onChange={(e) => setFormData({ ...formData, companyNameKr: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNameEn">회사명 (영문)</Label>
                  <Input
                    id="companyNameEn"
                    value={formData.companyNameEn}
                    onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ceoName">대표자명 *</Label>
                  <Input
                    id="ceoName"
                    value={formData.ceoName}
                    onChange={(e) => setFormData({ ...formData, ceoName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자등록번호 *</Label>
                  <Input
                    id="businessNumber"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    placeholder="000-00-00000"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>주소</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressKr">주소 (한글) *</Label>
                <Input
                  id="addressKr"
                  value={formData.addressKr}
                  onChange={(e) => setFormData({ ...formData, addressKr: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressEn">주소 (영문)</Label>
                <Input
                  id="addressEn"
                  value={formData.addressEn}
                  onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>연락처</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="000-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">팩스번호</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    placeholder="000-0000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
