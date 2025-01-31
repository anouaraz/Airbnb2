"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import DropzoneComponent from "./DropzoneComponent"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp } from "lucide-react"
import TermsAndConditionsPopup from "./TermsAndConditionsPopup"
import SignatureCanvas from "./signature-canvas"

const guestSchema = z.object({
  fullName: z.string().min(2, { message: "Le nom complet doit comporter au moins 2 caractères" }),
  sex: z.enum(["male", "female"], { required_error: "Veuillez sélectionner un sexe" }),
  nationality: z.string().min(1, { message: "Veuillez sélectionner une nationalité" }),
})

const formSchema = z.object({
  numberOfGuests: z.string().min(1, { message: "Veuillez sélectionner le nombre d'invités" }),
  guests: z.array(guestSchema),
  identification: z.array(z.any()).refine((files) => files.length > 0, "L'identification est requise"),
  marriageCertificate: z.array(z.any()).optional(),
  termsAccepted: z.enum(["accepted"], { required_error: "Vous devez accepter les conditions générales" }),
  signature: z.string().min(1, { message: "Veuillez fournir votre signature" }),
})

export function AirbnbMoroccoForm2() {
  const [requiresMarriageCertificate, setRequiresMarriageCertificate] = useState(false)
  const [signature, setSignature] = useState("")
  const [expandedGuests, setExpandedGuests] = useState<number[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfGuests: "1",
      guests: [{ fullName: "", sex: "male", nationality: "" }],
      identification: [],
      marriageCertificate: [],
      termsAccepted: undefined,
      signature: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    name: "guests",
    control: form.control,
  })

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "numberOfGuests" || name?.startsWith("guests")) {
        const numGuests = Number.parseInt(value.numberOfGuests as string, 10)
        const currentGuests = value.guests || []

        if (currentGuests.length < numGuests) {
          for (let i = currentGuests.length; i < numGuests; i++) {
            append({ fullName: "", sex: "male", nationality: "" })
          }
        } else if (currentGuests.length > numGuests) {
          for (let i = currentGuests.length - 1; i >= numGuests; i--) {
            remove(i)
          }
        }
        const hasMoroccanFemale = currentGuests.some(
          (guest) => guest?.nationality === "Moroccan" && guest?.sex === "female",
        )
        const hasMoroccanMale = currentGuests.some(
          (guest) => guest?.nationality === "Moroccan" && guest?.sex === "male",
        )
        const hasNonMoroccanFemale = currentGuests.some(
          (guest) => guest?.nationality !== "Moroccan" && guest?.sex === "female",
        )
        const hasNonMoroccanMale = currentGuests.some(
          (guest) => guest?.nationality !== "Moroccan" && guest?.sex === "male",
        )

        setRequiresMarriageCertificate(
          (hasMoroccanFemale && hasMoroccanMale) ||
            (hasMoroccanFemale && hasNonMoroccanMale) ||
            (hasMoroccanMale && hasNonMoroccanFemale),
        )
      }
    })

    return () => subscription.unsubscribe()
  }, [form.watch, append, remove])

  const toggleGuestExpansion = (index: number) => {
    setExpandedGuests((prev) => 
      prev.includes(index) ? [] : [index] // If clicked guest is already expanded, close it; else open it and close others
    );
  }

  const [isTermsPopupOpen, setIsTermsPopupOpen] = useState(false)

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // Here you would typically send the form data to your server
  }

  return (
    <div className="min-h-screen p-8 h-full">
      <Card className="max-w-6xl mx-auto bg-white/20 backdrop-blur-[14px] shadow-xl rounded-xl border border-white/20">
        <CardContent className="p-8">
          <h1 className="text-xl md:text-4xl font-bold mb-6 text-center text-white font-moroccan">
            Location d&apos;Appartement au Maroc
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="numberOfGuests"
                render={({ field }) => (
                  <FormItem className="w-[90%] md:w-[50%]">
                    <FormLabel className="text-md md:text-lg font-semibold text-white">Nombre d&apos;invités</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/20 text-white border-white/30 focus:ring-purple-400">
                          <SelectValue placeholder="Sélectionnez le nombre d'invités" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-violet-950 text-white">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator className="my-8 bg-white/30" />

              <div className="space-y-4">
                <h3 className="text-md md:text-lg font-semibold text-white mb-2 font-moroccan">
                  Informations des invités
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`guests.${index}`}
                      render={({ field }) => (
                        <FormItem className="relative">
                          <div
                            className="w-full bg-white/20 text-white border border-white/30 rounded-md p-3 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleGuestExpansion(index)}
                          >
                            <span>Invité {index + 1}</span>
                            {expandedGuests.includes(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                          {expandedGuests.includes(index) && (
                            <Card className="absolute top-full left-0 w-full mt-2 bg-violet-950 backdrop-blur-sm shadow-md rounded-lg overflow-hidden border border-white/30 z-10">
                              <CardContent className="p-4 space-y-4">
                                <FormField
                                  control={form.control}
                                  name={`guests.${index}.fullName`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-white">Nom complet</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className="bg-white/10 text-white border-white/30 focus:ring-purple-400 w-full"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`guests.${index}.sex`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-white">Sexe</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="bg-white/10 text-white border-white/30 focus:ring-purple-400 w-full">
                                            <SelectValue placeholder="Sélectionnez le sexe" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-purple-800 text-white">
                                          <SelectItem value="male">Homme</SelectItem>
                                          <SelectItem value="female">Femme</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`guests.${index}.nationality`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-white">Nationalité</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="bg-white/10 text-white border-white/30 focus:ring-purple-400 w-full">
                                            <SelectValue placeholder="Sélectionnez votre nationalité" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-purple-800 text-white">
                                          <SelectItem value="Moroccan">Marocaine</SelectItem>
                                          <SelectItem value="French">Française</SelectItem>
                                          <SelectItem value="American">Américaine</SelectItem>
                                          <SelectItem value="Other">Autre</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="identification"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-md md:text-lg text-white font-moroccan">
                                        Identification (CIN ou Passeport)
                                      </FormLabel>
                                      <FormControl>
                                        <DropzoneComponent />
                                      </FormControl>
                                      <FormDescription className="text-white/70">
                                        Veuillez télécharger une copie de votre CIN ou passeport (recto et verso).
                                        Taille maximale du fichier : 5 Mo par image.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </CardContent>
                            </Card>
                          )}
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-8 bg-white/30" />

              {requiresMarriageCertificate && (
                <FormField
                  control={form.control}
                  name="marriageCertificate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md md:text-lg font-semibold text-white font-moroccan">
                        Certificat de mariage
                      </FormLabel>
                      <FormControl>
                        <DropzoneComponent />
                      </FormControl>
                      <FormDescription className="text-white/70">
                        Comme il y a des invités masculins et féminins, dont une femme marocaine, veuillez télécharger
                        votre certificat de mariage. Taille maximale du fichier : 5 Mo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-md md:text-lg font-semibold text-white font-moroccan">
                      Conditions générales
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="accepted" className="border-white text-purple-600" />
                          </FormControl>
                          <FormLabel className="font-normal text-white">
                            J&apos;accepte les{" "}
                            <span
                              className="underline cursor-pointer text-yellow-300 hover:text-yellow-400"
                              onClick={() => setIsTermsPopupOpen(true)}
                            >
                              conditions générales
                            </span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md md:text-lg font-semibold text-white">Signature</FormLabel>
                    <FormControl>
                      <SignatureCanvas
                        onChange={(sig) => {
                          setSignature(sig)
                          field.onChange(sig)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="flex items-center justify-center">
                <Button
                  type="submit"
                  className="w-[70%] md:w-[40%] bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-purple-900 font-bold py-3 px-10  rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-moroccan text-md md:text-lg"
                >
                  Soumettre la Demande
                </Button>
              </div>
            </form>
          </Form>

          <TermsAndConditionsPopup isOpen={isTermsPopupOpen} onClose={() => setIsTermsPopupOpen(false)} />
        </CardContent>
      </Card>
    </div>
  )
}

