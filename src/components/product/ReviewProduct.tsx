import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CustomStar = ({ filled, onClick, className }: { filled: boolean; onClick: () => void; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={`w-5 h-5 cursor-pointer ${filled ? 'text-foreground' : 'text-muted-foreground/30'} ${className}`}
    onClick={onClick}
  >
    <path 
      fillRule="evenodd" 
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" 
      clipRule="evenodd" 
    />
  </svg>
);

const ReviewProduct = ({ productId }: { productId: string }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const submitReview = async () => {
    setIsLoading(true);

    // Vérifier si l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour laisser un avis.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment: review.trim(),
    });

    setIsLoading(false);

    if (error) {
      // Avis déjà existant pour ce produit
      if (error.code === "23505") {
        toast({
          title: "Avis déjà soumis",
          description: "Vous avez déjà laissé un avis pour ce produit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur lors de l'envoi de l'avis",
          description: "Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Avis envoyé !",
      description: "Merci pour votre retour.",
    });

    setIsOpen(false);
    setRating(0);
    setReview("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-12 font-light rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background"
        >
          Laisser un avis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !rounded-none">
        <DialogHeader>
          <DialogTitle className="font-light text-xl">Laisser un avis</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-light text-foreground">Note</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <CustomStar
                  key={star}
                  filled={star <= rating}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-light text-foreground">Votre avis</label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Partagez votre expérience avec ce produit..."
              className="min-h-24 resize-none rounded-none font-light"
            />
          </div>
          
          <Button 
            onClick={submitReview}
            disabled={rating === 0 || review.trim() === "" || isLoading}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none"
          >
            {isLoading ? "Envoi en cours..." : "Envoyer l'avis"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewProduct;
