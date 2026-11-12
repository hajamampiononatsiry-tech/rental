/**
 * Utilitaire pour intercepter et formater proprement les erreurs 
 * renvoyées par le backend Django REST Framework.
 *
 * @param {object} error - L'objet d'erreur attrapé dans le bloc try/catch (Axios)
 * @returns {string} Message d'erreur lisible par l'utilisateur
 */
export const parseBackendError = (error) => {
  // 1. Gestion des erreurs réseau ou serveur inaccessible
  if (!error.response) {
    if (error.message === 'Network Error') {
      return "Impossible de contacter le serveur. Vérifiez votre connexion Internet.";
    }
    return error.message || "Une erreur réseau est survenue.";
  }

  const { status, data } = error.response;

  // 2. Gestion des erreurs selon le code HTTP
  if (status === 401) {
    return "Session expirée ou non autorisée. Veuillez vous reconnecter.";
  }

  if (status === 403) {
    return "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
  }

  if (status === 404) {
    return "La ressource demandée n'a pas été trouvée sur le serveur.";
  }

  if (status >= 500) {
    return "Erreur interne du serveur. Veuillez réessayer ultérieurement.";
  }

  // 3. Traitement de la réponse transmise par Django (status 400 Bad Request, etc.)
  if (data) {
    // Cas où Django renvoie directement un string
    if (typeof data === 'string') {
      return data;
    }

    // Cas d'une erreur globale (ex: Django REST detail ou error key)
    if (data.detail) {
      return typeof data.detail === 'string' 
        ? data.detail 
        : JSON.stringify(data.detail);
    }

    if (data.error) {
      return typeof data.error === 'string' 
        ? data.error 
        : JSON.stringify(data.error);
    }

    // Cas où Django renvoie un dictionnaire d'erreurs de validation par champ
    // Exemple : { "start_date": ["La date doit être valide."], "car": ["Ce champ est requis."] }
    if (typeof data === 'object') {
      const keys = Object.keys(data);

      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = data[firstKey];

        // Formatage du message associé à la clé
        const message = Array.isArray(val) ? val.join(', ') : String(val);

        // Dictionnaire de traduction des noms de champs du model Django
        const fieldNames = {
          start_date: "Date de début",
          end_date: "Date de fin",
          total_price: "Prix total",
          car: "Véhicule",
          user: "Utilisateur",
          email: "Adresse e-mail",
          password: "Mot de passe",
          username: "Nom d'utilisateur",
          first_name: "Prénom",
          last_name: "Nom",
          phone_number: "Numéro de téléphone",
          non_field_errors: "Erreur"
        };

        const label = fieldNames[firstKey] || firstKey;
        return `${label} : ${message}`;
      }
    }
  }

  // Fallback par défaut
  return "Une erreur inattendue est survenue. Veuillez réessayer.";
};

export default parseBackendError;